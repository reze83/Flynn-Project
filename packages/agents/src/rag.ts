/**
 * Flynn RAG (Retrieval-Augmented Generation) Module
 * Provides vector storage and semantic search capabilities
 * NO API KEY REQUIRED - uses local Hugging Face Transformers.js embeddings
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createLogger, getDataDir, logAudit, safeJsonParse } from "@flynn/core";
import { LibSQLVector } from "@mastra/libsql";
import { embed, embedMany, getEmbeddingDimensions } from "./embeddings.js";

const logger = createLogger("rag");

// Lazy-loaded vector store instance
let vectorStore: LibSQLVector | null = null;

// Persistent cache for RAG search results.  Each entry stores a timestamp
// and the actual results. An optional TTL (in milliseconds) can be
// configured via the FLYNN_CACHE_TTL environment variable. If TTL > 0,
// cached entries older than TTL will be ignored and removed. The cache
// persists in the `.flynn_cache` directory (overridable via FLYNN_CACHE_DIR).
const RAG_CACHE_DIR: string = process.env.FLYNN_CACHE_DIR || ".flynn_cache";
const RAG_CACHE_FILE: string = join(RAG_CACHE_DIR, "rag-search.json");
const CACHE_TTL_MS: number = Number.parseInt(process.env.FLYNN_CACHE_TTL || "0", 10) || 0;
let ragCacheLoaded = false;
// The cache maps keys to objects containing a timestamp and the search results
let ragCache: Record<string, { timestamp: number; results: SearchResult[] }> = {};

function loadRagCache(): void {
  if (ragCacheLoaded) return;
  try {
    if (existsSync(RAG_CACHE_FILE)) {
      // SECURITY: Use safeJsonParse to prevent prototype pollution
      const data = safeJsonParse<Record<string, { timestamp: number; results: SearchResult[] }>>(
        readFileSync(RAG_CACHE_FILE, "utf8"),
      );
      ragCache = data;
      logger.debug({ entries: Object.keys(data).length }, "RAG cache loaded from disk");
    }
  } catch (error) {
    // Log but don't fail - cache will start empty
    logger.debug({ error }, "Failed to load RAG cache");
    ragCache = {};
  } finally {
    ragCacheLoaded = true;
  }
}

function saveRagCache(): void {
  try {
    if (!existsSync(RAG_CACHE_DIR)) {
      mkdirSync(RAG_CACHE_DIR, { recursive: true });
    }
    writeFileSync(RAG_CACHE_FILE, JSON.stringify(ragCache));
  } catch {
    // ignore write errors
  }
}

/**
 * RAG configuration options
 */
export interface RagConfig {
  dbPath?: string;
  indexName?: string;
}

/**
 * Search result with metadata
 */
export interface SearchResult {
  id: string;
  text: string;
  score: number;
  metadata?: Record<string, unknown>;
}

/**
 * Document chunk for indexing
 */
export interface DocumentChunk {
  id?: string;
  text: string;
  metadata?: Record<string, unknown>;
}

/**
 * Initialize the RAG system
 */
export async function initializeRag(config: RagConfig = {}): Promise<void> {
  const dbPath = config.dbPath || join(getDataDir(), "knowledge.db");
  const dbDir = dirname(dbPath);

  logger.info({ dbPath }, "Initializing RAG system");

  // Ensure backing directory exists
  mkdirSync(dbDir, { recursive: true });

  // Initialize vector store
  vectorStore = new LibSQLVector({
    connectionUrl: `file:${dbPath}`,
  });

  // Create index if it doesn't exist
  const indexName = config.indexName || "documents";
  const dimensions = getEmbeddingDimensions();

  try {
    await vectorStore.createIndex({
      indexName,
      dimension: dimensions,
    });
    logger.info({ indexName, dimensions }, "Vector index created/verified");
  } catch (error) {
    // Index may already exist
    logger.debug({ indexName, error }, "Index creation skipped (may exist)");
  }
}

/**
 * Get or initialize the vector store
 */
async function getVectorStore(): Promise<LibSQLVector> {
  if (!vectorStore) {
    await initializeRag();
  }
  // biome-ignore lint/style/noNonNullAssertion: initializeRag sets vectorStore
  return vectorStore!;
}

/**
 * Index documents into the vector store
 */
export async function indexDocuments(
  chunks: DocumentChunk[],
  indexName = "documents",
): Promise<{ indexed: number }> {
  const store = await getVectorStore();

  logger.info({ count: chunks.length, indexName }, "Indexing documents");

  // Generate embeddings for all chunks using local embeddings
  const embeddings = await embedMany(chunks.map((chunk) => chunk.text));

  // Prepare vectors with metadata
  const ids = chunks.map((chunk, i) => chunk.id || `doc_${Date.now()}_${i}`);

  // Upsert into vector store
  await store.upsert({
    indexName,
    vectors: embeddings,
    ids,
    metadata: chunks.map((chunk) => ({
      text: chunk.text,
      ...chunk.metadata,
    })),
  });

  logger.info({ indexed: chunks.length }, "Documents indexed successfully");

  return { indexed: chunks.length };
}

/**
 * Search the knowledge base
 */
export async function searchKnowledge(
  query: string,
  options: {
    topK?: number;
    indexName?: string;
    filter?: Record<string, unknown>;
  } = {},
): Promise<SearchResult[]> {
  const { topK = 5, indexName = "documents" } = options;

  const store = await getVectorStore();

  logger.debug({ query, topK, indexName }, "Searching knowledge base");
  // Load persistent search cache
  loadRagCache();
  const cacheKey = `${query}::${topK}::${indexName}`;
  const cacheEntry = ragCache[cacheKey];
  if (cacheEntry) {
    // Check TTL if configured; remove expired entries
    if (CACHE_TTL_MS > 0 && Date.now() - cacheEntry.timestamp > CACHE_TTL_MS) {
      delete ragCache[cacheKey];
      saveRagCache();
    } else {
      // Return cached result and audit the cache hit
      logAudit("rag-search-cache", { query, topK, indexName });
      return cacheEntry.results;
    }
  }

  // Generate query embedding using local embeddings
  const embedding = await embed(query);
  // Query vector store (filter not supported in current LibSQLVector version)
  const results = await store.query({
    indexName,
    queryVector: embedding,
    topK,
  });
  const searchResults: SearchResult[] = results.map((result) => ({
    id: result.id || "unknown",
    text: (result.metadata?.text as string) || "",
    score: result.score || 0,
    metadata: result.metadata,
  }));
  // Persist to cache with timestamp and audit the search
  ragCache[cacheKey] = { timestamp: Date.now(), results: searchResults };
  saveRagCache();
  logAudit("rag-search", { query, topK, indexName, results: searchResults.length });
  logger.debug({ results: searchResults.length }, "Search completed");
  return searchResults;
}

/**
 * Delete documents from the index
 */
export async function deleteDocuments(
  ids: string[],
  indexName = "documents",
): Promise<{ deleted: number }> {
  if (ids.length === 0) {
    return { deleted: 0 };
  }

  const store = await getVectorStore();
  logger.info({ count: ids.length, indexName }, "Deleting documents");

  let deleted = 0;

  // Delete each document individually
  for (const id of ids) {
    try {
      await store.deleteVector({ indexName, id });
      deleted++;
    } catch (error) {
      logger.warn({ id, error }, "Failed to delete document");
    }
  }

  logger.info({ deleted, total: ids.length }, "Documents deleted");

  return { deleted };
}

/**
 * Clear all documents from an index
 * Note: Recreates the index to clear all data
 */
export async function clearIndex(indexName = "documents"): Promise<void> {
  const store = await getVectorStore();
  const dimensions = getEmbeddingDimensions();

  logger.warn({ indexName }, "Clearing index");

  // Drop and recreate the index
  try {
    await store.deleteIndex({ indexName });
  } catch {
    // Index may not exist
  }

  await store.createIndex({
    indexName,
    dimension: dimensions,
  });

  logger.info({ indexName }, "Index cleared and recreated");
}

/**
 * Get RAG system status
 */
export async function getRagStatus(): Promise<{
  initialized: boolean;
  provider: string;
  dimensions: number;
}> {
  const { validateEmbeddingConfig } = await import("./embeddings.js");
  const config = validateEmbeddingConfig();

  return {
    initialized: vectorStore !== null,
    provider: config.provider,
    dimensions: getEmbeddingDimensions(),
  };
}

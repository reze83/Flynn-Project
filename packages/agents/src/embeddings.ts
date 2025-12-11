/**
 * Flynn Embeddings - Local embeddings with Hugging Face Transformers.js
 * NO API KEY REQUIRED - runs entirely locally
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createLogger, logAudit, safeJsonParse } from "@flynn/core";
import type { FeatureExtractionPipeline } from "@huggingface/transformers";

const logger = createLogger("embeddings");

let extractor: FeatureExtractionPipeline | null = null;

// Determine the directory and file used for persistent embedding cache.
// Users may override the directory via the FLYNN_CACHE_DIR environment variable.
const CACHE_DIR: string = process.env.FLYNN_CACHE_DIR || ".flynn_cache";
const EMBEDDING_CACHE_FILE: string = join(CACHE_DIR, "embeddings.json");
// Flag to ensure the cache is loaded from disk only once per runtime.
let cacheLoaded = false;

// PERFORMANCE: LRU cache configuration
const MAX_CACHE_SIZE = 1000; // Maximum number of cached embeddings
const DEBOUNCE_INTERVAL_MS = 5000; // Save cache every 5 seconds max

// Simple in-memory cache for embedding results with LRU tracking.
// The key is the exact text, and the value includes the embedding and last access time.
interface CacheEntry {
  embedding: number[];
  lastAccess: number;
}
const embeddingCache: Map<string, CacheEntry> = new Map();

// PERFORMANCE: Debounced cache persistence
let savePending = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let isDirty = false;

/**
 * Schedule a debounced cache save
 * PERFORMANCE: Prevents synchronous writes on every embedding
 */
function scheduleCacheSave(): void {
  isDirty = true;
  if (savePending) return;

  savePending = true;
  saveTimer = setTimeout(() => {
    saveCacheNow();
    savePending = false;
    saveTimer = null;
  }, DEBOUNCE_INTERVAL_MS);
}

/**
 * Force immediate cache save (for cleanup/shutdown)
 */
function saveCacheNow(): void {
  if (!isDirty) return;
  try {
    if (!existsSync(CACHE_DIR)) {
      mkdirSync(CACHE_DIR, { recursive: true });
    }
    const obj: Record<string, number[]> = {};
    for (const [key, entry] of embeddingCache.entries()) {
      obj[key] = entry.embedding;
    }
    writeFileSync(EMBEDDING_CACHE_FILE, JSON.stringify(obj));
    isDirty = false;
    logger.debug({ entries: embeddingCache.size }, "Embedding cache saved to disk");
  } catch (error) {
    logger.debug({ error }, "Failed to save embedding cache");
  }
}

/**
 * PERFORMANCE: Evict oldest entries when cache exceeds max size
 * Uses LRU (Least Recently Used) eviction strategy
 */
function evictIfNeeded(): void {
  if (embeddingCache.size <= MAX_CACHE_SIZE) return;

  // Find and remove least recently used entries
  const entriesToRemove = embeddingCache.size - MAX_CACHE_SIZE + Math.floor(MAX_CACHE_SIZE * 0.1);
  const entries = Array.from(embeddingCache.entries())
    .sort((a, b) => a[1].lastAccess - b[1].lastAccess)
    .slice(0, entriesToRemove);

  for (const [key] of entries) {
    embeddingCache.delete(key);
  }

  logger.debug(
    { removed: entriesToRemove, remaining: embeddingCache.size },
    "Evicted old cache entries",
  );
}

// Cleanup on process exit
process.on("exit", () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveCacheNow();
});

process.on("SIGINT", () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveCacheNow();
  process.exit(0);
});

process.on("SIGTERM", () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveCacheNow();
  process.exit(0);
});

/**
 * Load the embedding cache from disk on first use. This function reads
 * the JSON file at EMBEDDING_CACHE_FILE and populates the in-memory
 * Map. If the file does not exist or parsing fails, the cache remains
 * empty. Subsequent calls are no-ops.
 */
async function loadCache(): Promise<void> {
  if (cacheLoaded) return;
  try {
    if (existsSync(EMBEDDING_CACHE_FILE)) {
      // SECURITY: Use safeJsonParse to prevent prototype pollution
      const data = safeJsonParse<Record<string, number[]>>(
        readFileSync(EMBEDDING_CACHE_FILE, "utf8"),
      );
      const now = Date.now();
      for (const key of Object.keys(data)) {
        embeddingCache.set(key, {
          embedding: data[key] as number[],
          lastAccess: now,
        });
      }
      logger.debug({ entries: Object.keys(data).length }, "Embedding cache loaded from disk");
    }
  } catch (error) {
    // Log but don't fail - cache will start empty
    logger.debug({ error }, "Failed to load embedding cache");
  } finally {
    cacheLoaded = true;
  }
}

// NOTE: saveCache() has been replaced by scheduleCacheSave() and saveCacheNow()
// for debounced persistence. See the PERFORMANCE section above.

export interface EmbedderConfig {
  provider: "transformers";
  model: string;
  dimensions: number;
}

/**
 * Initialize the local embedding model
 * First call downloads ~30MB model, then cached locally
 */
async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractor) {
    logger.info("Loading local embedding model (first run downloads ~30MB)...");

    // Dynamic import to avoid issues with ESM/CJS
    const { pipeline } = (await import("@huggingface/transformers")) as {
      pipeline: (...args: unknown[]) => Promise<FeatureExtractionPipeline>;
    };

    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

    logger.info("Embedding model loaded successfully");
  }
  return extractor;
}

/**
 * Create embeddings for a single text
 */
export async function embed(text: string): Promise<number[]> {
  // Ensure persistent cache is loaded
  await loadCache();
  // Check in-memory cache first
  const cached = embeddingCache.get(text);
  if (cached) {
    // Update last access time for LRU tracking
    cached.lastAccess = Date.now();
    // Record audit entry that cache hit occurred
    logAudit("embed", { textLength: text.length, fromCache: true });
    return cached.embedding;
  }
  const model = await getExtractor();
  const result = await model(text, { pooling: "mean", normalize: true });
  const embedding = Array.from(result.data as Float32Array);
  // PERFORMANCE: Store in cache with LRU tracking
  embeddingCache.set(text, { embedding, lastAccess: Date.now() });
  // PERFORMANCE: Evict old entries if needed
  evictIfNeeded();
  // PERFORMANCE: Debounced persistence instead of synchronous write
  scheduleCacheSave();
  // Record audit entry for new embedding
  logAudit("embed", { textLength: text.length, fromCache: false });
  return embedding;
}

/**
 * Create embeddings for multiple texts
 */
export async function embedMany(texts: string[]): Promise<number[][]> {
  // Ensure persistent cache is loaded
  await loadCache();
  const model = await getExtractor();
  const results: number[][] = [];
  let hits = 0;
  let misses = 0;
  const now = Date.now();

  for (const text of texts) {
    const cached = embeddingCache.get(text);
    if (cached) {
      hits++;
      // Update last access time for LRU tracking
      cached.lastAccess = now;
      results.push(cached.embedding);
      continue;
    }
    misses++;
    const result = await model(text, { pooling: "mean", normalize: true });
    const embedding = Array.from(result.data as Float32Array);
    // PERFORMANCE: Store with LRU tracking
    embeddingCache.set(text, { embedding, lastAccess: now });
    results.push(embedding);
  }

  // PERFORMANCE: Evict old entries if needed and schedule debounced save
  if (misses > 0) {
    evictIfNeeded();
    scheduleCacheSave();
  }

  // Log audit information summarising hit/miss counts
  logAudit("embedMany", { count: texts.length, cacheHits: hits, cacheMisses: misses });
  return results;
}

/**
 * Get embedding dimensions (384 for all-MiniLM-L6-v2)
 */
export function getEmbeddingDimensions(): number {
  return 384;
}

/**
 * Get embedding configuration
 */
export function getEmbeddingConfig(): EmbedderConfig {
  return {
    provider: "transformers",
    model: "Xenova/all-MiniLM-L6-v2",
    dimensions: 384,
  };
}

/**
 * Validate embedding environment (always valid - no API key needed)
 */
export function validateEmbeddingConfig(): {
  valid: boolean;
  provider: string;
  warnings: string[];
} {
  return {
    valid: true,
    provider: "transformers",
    warnings: [
      "Using local Hugging Face Transformers.js embeddings",
      "First run will download ~30MB model (cached afterwards)",
    ],
  };
}

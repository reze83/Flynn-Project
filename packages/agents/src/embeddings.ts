/**
 * Flynn Embeddings - Local embeddings with Hugging Face Transformers.js
 * NO API KEY REQUIRED - runs entirely locally
 */

import { createLogger, logAudit } from "@flynn/core";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { FeatureExtractionPipeline } from "@huggingface/transformers";

const logger = createLogger("embeddings");

let extractor: FeatureExtractionPipeline | null = null;

// Determine the directory and file used for persistent embedding cache.
// Users may override the directory via the FLYNN_CACHE_DIR environment variable.
const CACHE_DIR: string = process.env.FLYNN_CACHE_DIR || ".flynn_cache";
const EMBEDDING_CACHE_FILE: string = join(CACHE_DIR, "embeddings.json");
// Flag to ensure the cache is loaded from disk only once per runtime.
let cacheLoaded = false;

// Simple in-memory cache for embedding results. Caches results for identical
// input strings to avoid recomputing embeddings. The key is the exact text,
// and the value is the resulting embedding array.
const embeddingCache: Map<string, number[]> = new Map();

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
      const data = JSON.parse(readFileSync(EMBEDDING_CACHE_FILE, "utf8"));
      for (const key of Object.keys(data)) {
        embeddingCache.set(key, data[key] as number[]);
      }
    }
  } catch {
    // Ignore errors; cache will start empty
  } finally {
    cacheLoaded = true;
  }
}

/**
 * Persist the current state of the embedding cache to disk. The cache is
 * serialised to JSON and written to EMBEDDING_CACHE_FILE. Errors are
 * swallowed silently to avoid interfering with embedding generation.
 */
function saveCache(): void {
  try {
    if (!existsSync(CACHE_DIR)) {
      mkdirSync(CACHE_DIR, { recursive: true });
    }
    const obj: Record<string, number[]> = {};
    for (const [key, value] of embeddingCache.entries()) {
      obj[key] = value;
    }
    writeFileSync(EMBEDDING_CACHE_FILE, JSON.stringify(obj));
  } catch {
    // Ignore write errors
  }
}

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
    // Record audit entry that cache hit occurred
    logAudit("embed", { textLength: text.length, fromCache: true });
    return cached;
  }
  const model = await getExtractor();
  const result = await model(text, { pooling: "mean", normalize: true });
  const embedding = Array.from(result.data as Float32Array);
  // Store in cache and persist
  embeddingCache.set(text, embedding);
  saveCache();
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
  for (const text of texts) {
    const cached = embeddingCache.get(text);
    if (cached) {
      hits++;
      results.push(cached);
      continue;
    }
    misses++;
    const result = await model(text, { pooling: "mean", normalize: true });
    const embedding = Array.from(result.data as Float32Array);
    embeddingCache.set(text, embedding);
    results.push(embedding);
  }
  // Persist updated cache if there were any misses
  if (misses > 0) {
    saveCache();
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

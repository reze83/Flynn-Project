/**
 * Simple In-Memory Cache Module
 *
 * Provides TTL-based caching for expensive operations like
 * agent context loading, skill retrieval, and project analysis.
 */

import { createLogger } from "@flynn/core";

const logger = createLogger("cache");

/**
 * Cache entry with value and expiration
 */
interface CacheEntry<T> {
  value: T;
  expires: number;
  createdAt: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

/**
 * Simple in-memory cache with TTL support
 */
export class SimpleCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private defaultTTL: number;
  private maxSize: number;
  private stats = { hits: 0, misses: 0 };

  /**
   * Create a new cache instance
   * @param defaultTTLMs - Default time-to-live in milliseconds (default: 5 minutes)
   * @param maxSize - Maximum number of entries (default: 100)
   */
  constructor(defaultTTLMs: number = 5 * 60 * 1000, maxSize = 100) {
    this.defaultTTL = defaultTTLMs;
    this.maxSize = maxSize;
  }

  /**
   * Get a value from the cache
   * @param key - Cache key
   * @returns The cached value or undefined if not found/expired
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      this.stats.misses++;
      logger.debug({ key }, "Cache entry expired");
      return undefined;
    }

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Set a value in the cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttlMs - Optional TTL override in milliseconds
   */
  set(key: string, value: T, ttlMs?: number): void {
    // Enforce max size with LRU-like eviction
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + (ttlMs ?? this.defaultTTL),
      createdAt: Date.now(),
    });

    logger.debug({ key, ttl: ttlMs ?? this.defaultTTL }, "Cache entry set");
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
    logger.debug("Cache cleared");
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache) {
      if (now > entry.expires) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug({ removed }, "Cleaned up expired cache entries");
    }

    return removed;
  }

  /**
   * Get or set with a factory function
   */
  async getOrSet(key: string, factory: () => Promise<T> | T, ttlMs?: number): Promise<T> {
    const existing = this.get(key);
    if (existing !== undefined) {
      return existing;
    }

    const value = await factory();
    this.set(key, value, ttlMs);
    return value;
  }

  /**
   * Evict the oldest entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Number.POSITIVE_INFINITY;

    for (const [key, entry] of this.cache) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.debug({ key: oldestKey }, "Evicted oldest cache entry");
    }
  }
}

// ============================================================================
// Singleton Cache Instances for Common Use Cases
// ============================================================================

/**
 * Cache for agent context (10 minute TTL)
 * Used by get-agent-context.ts
 */
export const agentContextCache = new SimpleCache<unknown>(10 * 60 * 1000, 50);

/**
 * Cache for loaded skills (10 minute TTL)
 * Used by get-skill.ts
 */
export const skillCache = new SimpleCache<unknown>(10 * 60 * 1000, 100);

/**
 * Cache for project analysis results (1 minute TTL - shorter due to file changes)
 * Used by project-analysis.ts
 */
export const projectAnalysisCache = new SimpleCache<unknown>(60 * 1000, 20);

/**
 * Cache for workflow templates (30 minute TTL - rarely changes)
 * Used by orchestrate.ts
 */
export const workflowCache = new SimpleCache<unknown>(30 * 60 * 1000, 50);

/**
 * Cache for MCP tool metadata (5 minute TTL)
 * Used by mcp-registry.ts
 */
export const mcpToolCache = new SimpleCache<unknown>(5 * 60 * 1000, 200);

// ============================================================================
// Cache Utilities
// ============================================================================

/**
 * Clear all singleton caches
 */
export function clearAllCaches(): void {
  agentContextCache.clear();
  skillCache.clear();
  projectAnalysisCache.clear();
  workflowCache.clear();
  mcpToolCache.clear();
  logger.info("All caches cleared");
}

/**
 * Get statistics for all singleton caches
 */
export function getAllCacheStats(): Record<string, CacheStats> {
  return {
    agentContext: agentContextCache.getStats(),
    skill: skillCache.getStats(),
    projectAnalysis: projectAnalysisCache.getStats(),
    workflow: workflowCache.getStats(),
    mcpTool: mcpToolCache.getStats(),
  };
}

/**
 * Cleanup expired entries in all singleton caches
 */
export function cleanupAllCaches(): Record<string, number> {
  return {
    agentContext: agentContextCache.cleanup(),
    skill: skillCache.cleanup(),
    projectAnalysis: projectAnalysisCache.cleanup(),
    workflow: workflowCache.cleanup(),
    mcpTool: mcpToolCache.cleanup(),
  };
}

/**
 * Generate a cache key from multiple parts
 */
export function generateCacheKey(...parts: (string | number | boolean | undefined)[]): string {
  return parts
    .filter((p) => p !== undefined)
    .map((p) => String(p))
    .join(":");
}

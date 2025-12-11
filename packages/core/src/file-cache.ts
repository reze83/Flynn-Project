/**
 * Shared File Cache Utility
 *
 * Provides a standardized pattern for persistent JSON file caching with:
 * - Safe JSON parsing (prototype pollution protection)
 * - Debounced writes (configurable interval)
 * - LRU eviction (configurable max size)
 * - Error logging (non-blocking)
 *
 * This consolidates the duplicate cache patterns found in:
 * - embeddings.ts
 * - rag.ts
 * - project-analysis.ts
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { createLogger } from "./logger.js";
import { safeJsonParse } from "./safe-json.js";

const logger = createLogger("file-cache");

/**
 * Configuration options for FileCache
 */
export interface FileCacheOptions<T> {
  /** Path to the cache file */
  filePath: string;
  /** Maximum number of entries (0 = unlimited) */
  maxSize?: number;
  /** Debounce interval in ms for writes (0 = immediate) */
  debounceMs?: number;
  /** Optional TTL in ms for entries (0 = no expiry) */
  ttlMs?: number;
  /** Transform function when loading from disk */
  deserialize?: (data: Record<string, unknown>) => Map<string, T>;
  /** Transform function when saving to disk */
  serialize?: (cache: Map<string, T>) => Record<string, unknown>;
}

/**
 * Cache entry with metadata for LRU and TTL tracking
 */
interface CacheEntry<T> {
  value: T;
  lastAccess: number;
  createdAt: number;
}

/**
 * Generic file-backed cache with LRU eviction and debounced persistence
 */
export class FileCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private filePath: string;
  private maxSize: number;
  private debounceMs: number;
  private ttlMs: number;
  private loaded = false;
  private dirty = false;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private savePending = false;

  constructor(options: FileCacheOptions<T>) {
    this.filePath = options.filePath;
    this.maxSize = options.maxSize ?? 1000;
    this.debounceMs = options.debounceMs ?? 5000;
    this.ttlMs = options.ttlMs ?? 0;

    // Register cleanup handlers
    this.registerCleanupHandlers();
  }

  /**
   * Get a value from the cache
   */
  get(key: string): T | undefined {
    this.ensureLoaded();
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check TTL
    if (this.ttlMs > 0 && Date.now() - entry.createdAt > this.ttlMs) {
      this.cache.delete(key);
      this.scheduleSave();
      return undefined;
    }

    // Update last access for LRU
    entry.lastAccess = Date.now();
    return entry.value;
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: T): void {
    this.ensureLoaded();
    const now = Date.now();

    this.cache.set(key, {
      value,
      lastAccess: now,
      createdAt: now,
    });

    this.evictIfNeeded();
    this.scheduleSave();
  }

  /**
   * Check if a key exists
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Delete a key from the cache
   */
  delete(key: string): boolean {
    this.ensureLoaded();
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.scheduleSave();
    }
    return deleted;
  }

  /**
   * Get or set a value using a factory function
   */
  async getOrSet(key: string, factory: () => T | Promise<T>): Promise<T> {
    const existing = this.get(key);
    if (existing !== undefined) {
      return existing;
    }

    const value = await factory();
    this.set(key, value);
    return value;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    this.dirty = true;
    this.saveNow();
  }

  /**
   * Get the number of entries
   */
  get size(): number {
    this.ensureLoaded();
    return this.cache.size;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    this.ensureLoaded();
    return Array.from(this.cache.keys());
  }

  /**
   * Force immediate save
   */
  flush(): void {
    this.saveNow();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; filePath: string } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      filePath: this.filePath,
    };
  }

  // ─────────────────────────────────────────
  // Private Methods
  // ─────────────────────────────────────────

  private ensureLoaded(): void {
    if (this.loaded) return;

    try {
      if (existsSync(this.filePath)) {
        const content = readFileSync(this.filePath, "utf-8");
        const data = safeJsonParse<Record<string, T>>(content);
        const now = Date.now();

        for (const [key, value] of Object.entries(data)) {
          this.cache.set(key, {
            value,
            lastAccess: now,
            createdAt: now,
          });
        }

        logger.debug({ entries: this.cache.size, file: this.filePath }, "Cache loaded from disk");
      }
    } catch (error) {
      logger.debug({ error, file: this.filePath }, "Failed to load cache");
    } finally {
      this.loaded = true;
    }
  }

  private evictIfNeeded(): void {
    if (this.maxSize <= 0 || this.cache.size <= this.maxSize) return;

    // Calculate how many to remove (10% buffer)
    const toRemove = this.cache.size - this.maxSize + Math.floor(this.maxSize * 0.1);

    // Sort by last access time and remove oldest
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastAccess - b[1].lastAccess)
      .slice(0, toRemove);

    for (const [key] of entries) {
      this.cache.delete(key);
    }

    logger.debug({ removed: toRemove, remaining: this.cache.size }, "Evicted old cache entries");
  }

  private scheduleSave(): void {
    this.dirty = true;

    if (this.debounceMs <= 0) {
      this.saveNow();
      return;
    }

    if (this.savePending) return;

    this.savePending = true;
    this.saveTimer = setTimeout(() => {
      this.saveNow();
      this.savePending = false;
      this.saveTimer = null;
    }, this.debounceMs);
  }

  private saveNow(): void {
    if (!this.dirty) return;

    try {
      const dir = dirname(this.filePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      // Convert to simple object for serialization
      const data: Record<string, T> = {};
      for (const [key, entry] of this.cache.entries()) {
        data[key] = entry.value;
      }

      writeFileSync(this.filePath, JSON.stringify(data));
      this.dirty = false;

      logger.debug({ entries: this.cache.size, file: this.filePath }, "Cache saved to disk");
    } catch (error) {
      logger.debug({ error, file: this.filePath }, "Failed to save cache");
    }
  }

  private registerCleanupHandlers(): void {
    const cleanup = () => {
      if (this.saveTimer) {
        clearTimeout(this.saveTimer);
      }
      this.saveNow();
    };

    process.on("exit", cleanup);
    process.on("SIGINT", () => {
      cleanup();
      process.exit(0);
    });
    process.on("SIGTERM", () => {
      cleanup();
      process.exit(0);
    });
  }
}

/**
 * Create a new FileCache instance with sensible defaults
 */
export function createFileCache<T>(
  filePath: string,
  options?: Partial<Omit<FileCacheOptions<T>, "filePath">>,
): FileCache<T> {
  return new FileCache({
    filePath,
    maxSize: 1000,
    debounceMs: 5000,
    ttlMs: 0,
    ...options,
  });
}

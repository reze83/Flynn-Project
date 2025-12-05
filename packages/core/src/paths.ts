/**
 * XDG-compliant, environment-based path resolution
 */

import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Get XDG data directory
 * @returns Path to data directory (e.g., ~/.local/share/flynn)
 */
export function getDataDir(): string {
  const xdgDataHome = process.env.XDG_DATA_HOME || join(homedir(), ".local", "share");
  return join(xdgDataHome, "flynn");
}

/**
 * Get XDG config directory
 * @returns Path to config directory (e.g., ~/.config/flynn)
 */
export function getConfigDir(): string {
  const xdgConfigHome = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
  return join(xdgConfigHome, "flynn");
}

/**
 * Get XDG cache directory
 * @returns Path to cache directory (e.g., ~/.cache/flynn)
 */
export function getCacheDir(): string {
  const xdgCacheHome = process.env.XDG_CACHE_HOME || join(homedir(), ".cache");
  return join(xdgCacheHome, "flynn");
}

/**
 * Get memory database path
 * @returns Path to SQLite memory database
 */
export function getMemoryDbPath(): string {
  return join(getDataDir(), "memory.db");
}

/**
 * @flynn/core - Core utilities and shared functionality
 */

export * from "./types.js";
export * from "./paths.js";
export * from "./logger.js";
export * from "./mcp-server.js";
export * from "./agent-base.js";
export * from "./policy.js";

// Audit logger. Provides logAudit() to record tool invocations to a
// persistent audit file. See packages/core/src/audit-logger.ts for
// implementation details.
export * from "./audit-logger.js";

// Safe JSON parsing utilities. Prevents prototype pollution attacks.
// Use safeJsonParse() instead of JSON.parse() for all external data.
export * from "./safe-json.js";

// File-backed cache with LRU eviction and debounced persistence.
// Use FileCache for consistent caching patterns across the codebase.
export * from "./file-cache.js";

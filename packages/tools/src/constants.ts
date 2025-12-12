/**
 * Shared Constants
 *
 * Centralized constants for the Flynn tools package.
 * Extracted from various modules to reduce magic numbers and improve maintainability.
 */

// ============================================================================
// Timeout & Duration Constants
// ============================================================================

/**
 * Default timeout values in milliseconds
 */
export const TIMEOUTS = {
  /** Default tool execution timeout (2 minutes) */
  DEFAULT_TOOL_TIMEOUT_MS: 120000,
  /** Codex delegation timeout (10 minutes) */
  CODEX_DELEGATION_TIMEOUT_MS: 600000,
  /** Maximum chunk duration (3 minutes) */
  MAX_CHUNK_DURATION_MS: 180000,
  /** Health check timeout (30 seconds) */
  HEALTH_CHECK_TIMEOUT_MS: 30000,
  /** MCP tool discovery timeout (10 seconds) */
  MCP_DISCOVERY_TIMEOUT_MS: 10000,
  /** Cache cleanup interval (5 minutes) */
  CACHE_CLEANUP_INTERVAL_MS: 300000,
} as const;

// ============================================================================
// Cache Configuration
// ============================================================================

/**
 * Default cache settings
 */
export const CACHE_DEFAULTS = {
  /** Default TTL in milliseconds (5 minutes) */
  DEFAULT_TTL_MS: 300000,
  /** Maximum cache entries */
  MAX_ENTRIES: 100,
  /** Agent context cache TTL (10 minutes) */
  AGENT_CONTEXT_TTL_MS: 600000,
  /** Skill cache TTL (15 minutes) */
  SKILL_TTL_MS: 900000,
  /** Project analysis cache TTL (30 minutes) */
  PROJECT_ANALYSIS_TTL_MS: 1800000,
  /** Workflow cache TTL (10 minutes) */
  WORKFLOW_TTL_MS: 600000,
  /** MCP tool cache TTL (5 minutes) */
  MCP_TOOL_TTL_MS: 300000,
} as const;

// ============================================================================
// Analytics & Metrics
// ============================================================================

/**
 * Model pricing information (per million tokens)
 * Note: These values should be updated when pricing changes
 */
export const MODEL_PRICING = {
  haiku: {
    input: 0.25,
    output: 1.25,
  },
  sonnet: {
    input: 3.0,
    output: 15.0,
  },
  opus: {
    input: 15.0,
    output: 75.0,
  },
} as const;

/**
 * Analytics session defaults
 */
export const ANALYTICS_DEFAULTS = {
  /** Default session duration assumption (10 minutes) */
  DEFAULT_SESSION_DURATION_MS: 600000,
  /** Metrics retention period (30 days) */
  METRICS_RETENTION_DAYS: 30,
} as const;

// ============================================================================
// Orchestration & Routing
// ============================================================================

/**
 * Orchestration thresholds
 */
export const ORCHESTRATION = {
  /** Default parallel threshold for agent execution */
  DEFAULT_PARALLEL_THRESHOLD: 2,
  /** Maximum agents in a single workflow */
  MAX_WORKFLOW_AGENTS: 10,
  /** Task complexity threshold for chunking */
  COMPLEXITY_THRESHOLD: 60,
  /** Minimum chunks when chunking is required */
  MIN_CHUNKS: 2,
  /** Maximum chunks per task */
  MAX_CHUNKS: 10,
} as const;

// ============================================================================
// File & Path Limits
// ============================================================================

/**
 * File operation limits
 */
export const FILE_LIMITS = {
  /** Maximum file size for reading (10 MB) */
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  /** Maximum files in a single operation */
  MAX_FILES_PER_OPERATION: 100,
  /** Maximum path length */
  MAX_PATH_LENGTH: 4096,
} as const;

// ============================================================================
// Health Check
// ============================================================================

/**
 * Health check thresholds
 */
export const HEALTH_THRESHOLDS = {
  /** Memory usage warning threshold (80%) */
  MEMORY_WARNING_PERCENT: 80,
  /** Memory usage critical threshold (95%) */
  MEMORY_CRITICAL_PERCENT: 95,
  /** Disk usage warning threshold (85%) */
  DISK_WARNING_PERCENT: 85,
  /** Disk usage critical threshold (95%) */
  DISK_CRITICAL_PERCENT: 95,
} as const;

// ============================================================================
// Agent Configuration
// ============================================================================

/**
 * Agent defaults
 */
export const AGENT_DEFAULTS = {
  /** Default token estimate for tier 1 (metadata only) */
  TIER1_TOKEN_ESTIMATE: 500,
  /** Default token estimate for tier 2 (with instructions) */
  TIER2_TOKEN_ESTIMATE: 2000,
  /** Maximum instructions length */
  MAX_INSTRUCTIONS_LENGTH: 10000,
} as const;

// ============================================================================
// Skill System
// ============================================================================

/**
 * Skill loading configuration
 */
export const SKILL_DEFAULTS = {
  /** Tier 1 token estimate (metadata only) */
  TIER1_TOKEN_ESTIMATE: 100,
  /** Tier 2 token estimate (with instructions) */
  TIER2_TOKEN_ESTIMATE: 500,
  /** Tier 3 token estimate (full resources) */
  TIER3_TOKEN_ESTIMATE: 2000,
  /** Token savings percentage at tier 1 */
  TIER1_SAVINGS_PERCENT: 90,
  /** Token savings percentage at tier 2 */
  TIER2_SAVINGS_PERCENT: 70,
} as const;

// ============================================================================
// Logging & Debug
// ============================================================================

/**
 * Logging configuration
 */
export const LOGGING = {
  /** Maximum log message length before truncation */
  MAX_LOG_MESSAGE_LENGTH: 1000,
  /** Maximum stack trace depth */
  MAX_STACK_TRACE_DEPTH: 10,
  /** Log rotation size (10 MB) */
  LOG_ROTATION_SIZE_BYTES: 10 * 1024 * 1024,
} as const;

// ============================================================================
// Version & Compatibility
// ============================================================================

/**
 * Version information
 */
export const VERSION = {
  /** Minimum Node.js version */
  MIN_NODE_VERSION: "20.0.0",
  /** Handoff protocol version */
  HANDOFF_PROTOCOL_VERSION: "1.0.0",
  /** MCP protocol version */
  MCP_PROTOCOL_VERSION: "0.1.0",
} as const;

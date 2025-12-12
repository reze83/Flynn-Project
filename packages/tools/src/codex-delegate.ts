/**
 * Codex Delegate Tool
 *
 * This file re-exports the refactored Codex delegation module.
 * The implementation has been split into focused modules under ./codex/
 *
 * @see ./codex/index.ts - Main module entry
 * @see ./codex/types.ts - Type definitions
 * @see ./codex/config.ts - Configuration handling
 * @see ./codex/events.ts - Event parsing
 * @see ./codex/session.ts - Session management
 * @see ./codex/executor.ts - Execution logic
 * @see ./codex/operations.ts - Operation handlers
 * @see ./codex/tool.ts - MCP tool definition
 */

// Re-export everything from the refactored module
export {
  // Main tool
  codexDelegateTool,
  // Types
  type CodexEvent,
  type ParsedCodexEvent,
  type ThreadStartedEvent,
  type TurnStartedEvent,
  type ItemCompletedEvent,
  type TurnCompletedEvent,
  type OnChunkCallback,
  type OnProgressCallback,
  type ProgressInfo,
  type StreamingConfig,
  type CodexConfig,
  type CodexPaths,
  type LiveStatus,
  type TaskContext,
  type ExecutionResult,
  type ChunkedExecutionResult,
  type CodexDelegateInput,
  type CodexDelegateOutput,
  // Schemas
  codexDelegateInputSchema,
  codexDelegateOutputSchema,
  // Utilities
  getDefaultPaths,
  detectCodexPath,
  readCodexConfig,
  getSessionLogPaths,
  parseJsonlEvents,
  extractSummary,
  extractChunkSummary,
  writeStatusFile,
  appendToLog,
  ensureDir,
  getOrCreateHandoff,
  saveHandoff,
  tryReadLiveStatus,
  executeCodex,
  executeChunkedTask,
  buildChunkTaskDescription,
} from "./codex/index.js";

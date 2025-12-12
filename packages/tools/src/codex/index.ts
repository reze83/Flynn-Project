/**
 * Codex Module
 *
 * Centralized exports for Codex delegation functionality.
 * This module provides task delegation to OpenAI Codex CLI with streaming,
 * chunking, and session management support.
 */

// Main tool export
export { codexDelegateTool } from "./tool.js";

// Type exports
export type {
  // Event types
  CodexEvent,
  ParsedCodexEvent,
  ThreadStartedEvent,
  TurnStartedEvent,
  ItemCompletedEvent,
  TurnCompletedEvent,
  // Streaming types
  OnChunkCallback,
  OnProgressCallback,
  ProgressInfo,
  StreamingConfig,
  // Configuration types
  CodexConfig,
  CodexPaths,
  // Session types
  LiveStatus,
  TaskContext,
  ExecutionResult,
  ChunkedExecutionResult,
  // Input/Output types
  CodexDelegateInput,
  CodexDelegateOutput,
} from "./types.js";

// Schema exports for tool integration
export { codexDelegateInputSchema, codexDelegateOutputSchema } from "./types.js";

// Configuration utilities (for advanced use cases)
export { getDefaultPaths, detectCodexPath, readCodexConfig, getSessionLogPaths } from "./config.js";

// Event parsing utilities
export { parseJsonlEvents, extractSummary, extractChunkSummary } from "./events.js";

// Session management utilities
export {
  writeStatusFile,
  appendToLog,
  ensureDir,
  getOrCreateHandoff,
  saveHandoff,
  tryReadLiveStatus,
} from "./session.js";

// Execution utilities
export { executeCodex, executeChunkedTask, buildChunkTaskDescription } from "./executor.js";

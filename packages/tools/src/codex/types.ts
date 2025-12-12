/**
 * Codex Delegate Types
 *
 * Centralized type definitions for the Codex delegation system.
 */

import { z } from "zod";

// ============================================================================
// JSONL Event Types from Codex CLI
// ============================================================================

export interface CodexEvent {
  type: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface ThreadStartedEvent extends CodexEvent {
  type: "thread.started";
  thread_id: string;
}

export interface TurnStartedEvent extends CodexEvent {
  type: "turn.started";
  turn_id: string;
}

export interface ItemCompletedEvent extends CodexEvent {
  type: "item.completed";
  item: {
    type: string;
    content?: string;
    tool_call?: {
      name: string;
      arguments: string;
    };
    tool_result?: {
      output: string;
    };
  };
}

export interface TurnCompletedEvent extends CodexEvent {
  type: "turn.completed";
  summary?: string;
}

export type ParsedCodexEvent =
  | ThreadStartedEvent
  | TurnStartedEvent
  | ItemCompletedEvent
  | TurnCompletedEvent
  | CodexEvent;

// ============================================================================
// Streaming Types
// ============================================================================

/**
 * Callback for streaming output chunks
 */
export type OnChunkCallback = (chunk: string, event?: ParsedCodexEvent) => void;

/**
 * Progress information during execution
 */
export interface ProgressInfo {
  stage: "starting" | "running" | "completing";
  turnCount: number;
  elapsedMs: number;
  eventsReceived: number;
  lastEvent?: string;
  chunkProgress?: {
    currentChunk: number;
    totalChunks: number;
    currentChunkDescription: string;
  };
}

/**
 * Callback for progress updates
 */
export type OnProgressCallback = (progress: ProgressInfo) => void;

/**
 * Streaming configuration options
 */
export interface StreamingConfig {
  /** Called for each output chunk received */
  onChunk?: OnChunkCallback;
  /** Called periodically with progress updates */
  onProgress?: OnProgressCallback;
  /** Minimum interval between progress callbacks (ms) */
  progressIntervalMs?: number;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Codex config structure (from config.toml)
 */
export interface CodexConfig {
  model?: string;
  provider?: string;
  approval_mode?: string;
  sandbox?: {
    type?: string;
  };
  history?: {
    persistence?: string;
    save_path?: string;
  };
}

/**
 * Default paths for Codex operations
 */
export interface CodexPaths {
  codexPath: string | undefined;
  configPath: string;
  outputDir: string;
  sessionDir: string;
  handoffPath: string;
}

// ============================================================================
// Session Types
// ============================================================================

/**
 * Live status structure from status file
 */
export interface LiveStatus {
  status: "running" | "completed" | "failed" | "timeout";
  timestamp: string;
  details?: string;
}

/**
 * Context for delegation task
 */
export interface TaskContext {
  files?: string[];
  requirements?: string;
  constraints?: string[];
}

/**
 * Execution result from Codex
 */
export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  logFile?: string;
  sessionId?: string;
}

// ============================================================================
// Chunked Execution Types
// ============================================================================

/**
 * Result of chunked execution
 */
export interface ChunkedExecutionResult {
  success: boolean;
  completedChunks: number;
  totalChunks: number;
  outputs: Array<{
    chunkId: string;
    success: boolean;
    output: string;
    error?: string;
  }>;
  aggregatedOutput: string;
  errors: string[];
}

// ============================================================================
// Input/Output Schemas
// ============================================================================

export const codexDelegateInputSchema = z.object({
  operation: z.enum(["delegate", "resume", "status", "configure"]).describe("Operation to perform"),
  task: z.string().optional().describe("Task description for delegation"),
  workingDir: z.string().optional().describe("Working directory for Codex execution"),
  codexPath: z.string().optional().describe("Path to Codex CLI (auto-detected if not provided)"),
  configPath: z.string().optional().describe("Path to Codex config.toml"),
  outputDir: z.string().optional().describe("Directory for Codex output files"),
  sessionDir: z.string().optional().describe("Directory for session persistence"),
  handoffPath: z.string().optional().describe("Path to handoff file (relative to workingDir)"),
  sessionId: z.string().optional().describe("Session ID for resume/status operations"),
  timeout: z
    .number()
    .optional()
    .default(600000)
    .describe("Timeout in milliseconds (default: 10 minutes)"),
  enableChunking: z
    .boolean()
    .optional()
    .default(true)
    .describe("Enable automatic task chunking for complex tasks"),
  maxChunkDurationMs: z
    .number()
    .optional()
    .default(180000)
    .describe("Maximum duration per chunk when chunking (default: 3 minutes)"),
  context: z
    .object({
      files: z.array(z.string()).optional(),
      requirements: z.string().optional(),
      constraints: z.array(z.string()).optional(),
    })
    .optional()
    .describe("Additional context for the task"),
});

export const codexDelegateOutputSchema = z.object({
  success: z.boolean(),
  operation: z.string(),
  sessionId: z.string().optional(),
  codexPath: z.string().optional(),
  events: z
    .array(
      z.object({
        type: z.string(),
        timestamp: z.string().optional(),
      }),
    )
    .optional(),
  summary: z.string().optional(),
  handoffFile: z.string().optional(),
  logFile: z.string().optional(),
  statusFile: z.string().optional(),
  liveStatus: z
    .object({
      status: z.enum(["running", "completed", "failed", "timeout"]),
      timestamp: z.string(),
      details: z.string().optional(),
    })
    .optional(),
  config: z
    .object({
      model: z.string().optional(),
      provider: z.string().optional(),
      approvalMode: z.string().optional(),
    })
    .optional(),
  error: z.string().optional(),
  recoveryHint: z.string().optional(),
  chunking: z
    .object({
      enabled: z.boolean(),
      totalChunks: z.number(),
      completedChunks: z.number(),
      complexityScore: z.number(),
    })
    .optional(),
});

export type CodexDelegateInput = z.infer<typeof codexDelegateInputSchema>;
export type CodexDelegateOutput = z.infer<typeof codexDelegateOutputSchema>;

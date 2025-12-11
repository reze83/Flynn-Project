/**
 * Codex Delegate Tool
 *
 * Enables delegation of tasks to OpenAI Codex CLI with proper context handoff.
 * Supports configurable paths, session management, and error recovery.
 *
 * P2 Features:
 * - Streaming callbacks (onChunk, onProgress) for real-time feedback
 * - Task chunking integration for complex tasks
 * - Progress tracking with chunk information
 */

import { execSync, spawn } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { createLogger } from "@flynn/core";
import * as toml from "@iarna/toml";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import {
  type HandoffFile,
  addTask,
  createHandoffFile,
  parseHandoffFile,
  serializeHandoffFile,
  updateSessionStatus,
  updateTask,
} from "./handoff-protocol.js";
import { type ChunkingResult, type TaskChunk, chunkTask, needsChunking } from "./task-chunker.js";

const logger = createLogger("codex-delegate");

// ============================================================================
// Streaming Callbacks (P2 Feature)
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

// JSONL Event types from Codex CLI
interface CodexEvent {
  type: string;
  timestamp?: string;
  [key: string]: unknown;
}

interface ThreadStartedEvent extends CodexEvent {
  type: "thread.started";
  thread_id: string;
}

interface TurnStartedEvent extends CodexEvent {
  type: "turn.started";
  turn_id: string;
}

interface ItemCompletedEvent extends CodexEvent {
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

interface TurnCompletedEvent extends CodexEvent {
  type: "turn.completed";
  summary?: string;
}

type ParsedCodexEvent =
  | ThreadStartedEvent
  | TurnStartedEvent
  | ItemCompletedEvent
  | TurnCompletedEvent
  | CodexEvent;

// Re-export for external use
export type { ParsedCodexEvent };

// Codex config structure (from config.toml)
interface CodexConfig {
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
 * Get default paths with XDG compliance
 */
function getDefaultPaths() {
  const home = homedir();
  const xdgRuntime = process.env.XDG_RUNTIME_DIR;

  return {
    codexPath: undefined, // Will be auto-detected
    configPath: join(home, ".codex", "config.toml"),
    outputDir: xdgRuntime ? join(xdgRuntime, "flynn-codex") : join(tmpdir(), "flynn-codex"),
    sessionDir: join(home, ".flynn", "codex-sessions"),
    handoffPath: ".ai-handoff.json",
  };
}

/**
 * Auto-detect Codex CLI path
 */
function detectCodexPath(): string | undefined {
  try {
    const result = execSync("which codex", { encoding: "utf-8" }).trim();
    return result || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Read and parse Codex config.toml
 */
function readCodexConfig(configPath: string): CodexConfig | undefined {
  try {
    if (!existsSync(configPath)) {
      return undefined;
    }
    const content = readFileSync(configPath, "utf-8");
    return toml.parse(content) as CodexConfig;
  } catch {
    return undefined;
  }
}

/**
 * Parse JSONL events from Codex output
 */
function parseJsonlEvents(output: string): ParsedCodexEvent[] {
  const events: ParsedCodexEvent[] = [];
  const lines = output.split("\n").filter((line) => line.trim());

  for (const line of lines) {
    try {
      const event = JSON.parse(line) as ParsedCodexEvent;
      events.push(event);
    } catch {
      // Skip non-JSON lines
    }
  }

  return events;
}

/**
 * Extract summary from Codex events
 */
function extractSummary(events: ParsedCodexEvent[]): string {
  const messages: string[] = [];
  let threadId: string | undefined;
  let turnCount = 0;

  for (const event of events) {
    switch (event.type) {
      case "thread.started":
        threadId = (event as ThreadStartedEvent).thread_id;
        break;
      case "turn.started":
        turnCount++;
        break;
      case "item.completed": {
        const item = (event as ItemCompletedEvent).item;
        if (item.content) {
          messages.push(item.content);
        }
        if (item.tool_call) {
          messages.push(`[Tool: ${item.tool_call.name}]`);
        }
        break;
      }
      case "turn.completed": {
        const summary = (event as TurnCompletedEvent).summary;
        if (summary) {
          messages.push(`Summary: ${summary}`);
        }
        break;
      }
    }
  }

  return [threadId ? `Thread: ${threadId}` : "", `Turns: ${turnCount}`, messages.join("\n")]
    .filter(Boolean)
    .join("\n");
}

// Input schema
const inputSchema = z.object({
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

// Output schema
const outputSchema = z.object({
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
  // P2: Chunking information
  chunking: z
    .object({
      enabled: z.boolean(),
      totalChunks: z.number(),
      completedChunks: z.number(),
      complexityScore: z.number(),
    })
    .optional(),
});

type CodexDelegateInput = z.infer<typeof inputSchema>;
type CodexDelegateOutput = z.infer<typeof outputSchema>;

/**
 * Log file paths for a session
 */
function getSessionLogPaths(sessionDir: string, sessionId: string) {
  return {
    outputLog: join(sessionDir, `${sessionId}.log`),
    statusFile: join(sessionDir, `${sessionId}.status`),
  };
}

/**
 * Write status to file for external monitoring
 */
function writeStatusFile(
  statusFile: string,
  status: "running" | "completed" | "failed" | "timeout",
  details?: string,
): void {
  const statusData = {
    status,
    timestamp: new Date().toISOString(),
    details,
  };
  writeFileSync(statusFile, JSON.stringify(statusData, null, 2), "utf-8");
}

/**
 * Append to output log file for real-time monitoring
 */
function appendToLog(logFile: string, data: string): void {
  appendFileSync(logFile, data);
}

/**
 * Execute Codex CLI with JSON output, real-time logging, and streaming support
 */
async function executeCodex(
  codexPath: string,
  task: string,
  workingDir: string,
  timeout: number,
  sessionId?: string,
  sessionDir?: string,
  streaming?: StreamingConfig,
): Promise<{
  success: boolean;
  output: string;
  error?: string;
  sessionId?: string;
  logFile?: string;
}> {
  return new Promise((resolve) => {
    const args = ["exec", "--json", "--full-auto", "--skip-git-repo-check", task];
    let output = "";
    let errorOutput = "";

    // Streaming state tracking
    const startTime = Date.now();
    let eventsReceived = 0;
    let turnCount = 0;
    let lastEventType: string | undefined;
    let lastProgressTime = 0;
    const progressIntervalMs = streaming?.progressIntervalMs ?? 1000;

    // Helper to emit progress updates
    const emitProgress = (stage: ProgressInfo["stage"]) => {
      if (!streaming?.onProgress) return;
      const now = Date.now();
      if (stage === "running" && now - lastProgressTime < progressIntervalMs) return;
      lastProgressTime = now;

      streaming.onProgress({
        stage,
        turnCount,
        elapsedMs: now - startTime,
        eventsReceived,
        lastEvent: lastEventType,
      });
    };

    // Set up log files for real-time monitoring if sessionId is provided
    let logFile: string | undefined;
    let statusFile: string | undefined;
    if (sessionId && sessionDir) {
      const paths = getSessionLogPaths(sessionDir, sessionId);
      logFile = paths.outputLog;
      statusFile = paths.statusFile;

      // Initialize status as running
      writeStatusFile(statusFile, "running", `Started: ${task.substring(0, 100)}...`);

      // Clear/create log file
      writeFileSync(logFile, `=== Codex Session ${sessionId} ===\n`);
      appendToLog(logFile, `Task: ${task}\n`);
      appendToLog(logFile, `Started: ${new Date().toISOString()}\n`);
      appendToLog(logFile, `Working Directory: ${workingDir}\n`);
      appendToLog(logFile, `${"=".repeat(50)}\n\n`);
    }

    // Emit starting progress
    emitProgress("starting");

    const proc = spawn(codexPath, args, {
      cwd: workingDir,
      env: { ...process.env },
      stdio: ["pipe", "pipe", "pipe"],
    });

    const timeoutId = setTimeout(() => {
      proc.kill("SIGTERM");
      if (statusFile) {
        writeStatusFile(statusFile, "timeout", `Timeout after ${timeout}ms`);
      }
      if (logFile) {
        appendToLog(logFile, `\n\n=== TIMEOUT after ${timeout}ms ===\n`);
        appendToLog(
          logFile,
          "Note: Task may have completed in background. Check status with sessionId.\n",
        );
      }
      resolve({
        success: false,
        output,
        error: `Timeout after ${timeout}ms`,
        sessionId,
        logFile,
      });
    }, timeout);

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Event-driven callback with shared mutable state (output, eventsReceived, turnCount) - complexity inherent to streaming architecture
    proc.stdout?.on("data", (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;

      // Real-time logging to file
      if (logFile) {
        appendToLog(logFile, chunk);
      }

      // Streaming: Parse and emit events
      if (streaming?.onChunk) {
        // Try to parse as JSONL events
        const lines = chunk.split("\n").filter((line) => line.trim());
        for (const line of lines) {
          try {
            const event = JSON.parse(line) as ParsedCodexEvent;
            eventsReceived++;
            lastEventType = event.type;

            // Track turn count
            if (event.type === "turn.started") {
              turnCount++;
            }

            streaming.onChunk(line, event);
          } catch {
            // Non-JSON line, emit as raw chunk
            streaming.onChunk(line);
          }
        }
      }

      // Emit progress update
      emitProgress("running");
    });

    proc.stderr?.on("data", (data: Buffer) => {
      const chunk = data.toString();
      errorOutput += chunk;

      // Real-time logging to file (stderr)
      if (logFile) {
        appendToLog(logFile, `[STDERR] ${chunk}`);
      }

      // Also stream stderr if callback exists
      if (streaming?.onChunk) {
        streaming.onChunk(`[STDERR] ${chunk}`);
      }
    });

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Event callback handling completion with status updates, logging, and progress emission
    proc.on("close", (code) => {
      clearTimeout(timeoutId);
      const success = code === 0;

      // Update status file
      if (statusFile) {
        writeStatusFile(
          statusFile,
          success ? "completed" : "failed",
          success ? "Task completed successfully" : `Exit code: ${code}`,
        );
      }

      // Log completion
      if (logFile) {
        appendToLog(logFile, `\n\n=== ${success ? "COMPLETED" : "FAILED"} ===\n`);
        appendToLog(logFile, `Exit code: ${code}\n`);
        appendToLog(logFile, `Finished: ${new Date().toISOString()}\n`);
      }

      // Emit completing progress
      emitProgress("completing");

      resolve({
        success,
        output,
        error: code !== 0 ? errorOutput || `Exit code: ${code}` : undefined,
        logFile,
      });
    });

    proc.on("error", (err) => {
      clearTimeout(timeoutId);

      // Update status file
      if (statusFile) {
        writeStatusFile(statusFile, "failed", err.message);
      }

      // Log error
      if (logFile) {
        appendToLog(logFile, "\n\n=== ERROR ===\n");
        appendToLog(logFile, `${err.message}\n`);
      }

      resolve({
        success: false,
        output,
        error: err.message,
        sessionId,
        logFile,
      });
    });
  });
}

/**
 * Result of chunked execution
 */
interface ChunkedExecutionResult {
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

/**
 * Execute a task in chunks with dependency ordering and streaming support
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Orchestrates chunked execution with dependency tracking, parallel groups, and streaming - complexity inherent to task coordination
async function executeChunkedTask(
  codexPath: string,
  chunkingResult: ChunkingResult,
  workingDir: string,
  chunkTimeout: number,
  sessionId: string,
  sessionDir: string,
  streaming?: StreamingConfig,
): Promise<ChunkedExecutionResult> {
  const outputs: ChunkedExecutionResult["outputs"] = [];
  const errors: string[] = [];
  let completedChunks = 0;
  const totalChunks = chunkingResult.chunks.length;

  // Execute chunks in order (respecting execution groups)
  for (const group of chunkingResult.executionOrder) {
    // Execute chunks in this group (could be parallelized in future)
    for (const chunkId of group) {
      const chunk = chunkingResult.chunks.find((c) => c.id === chunkId);
      if (!chunk) continue;

      // Build context-aware task description
      const chunkTask = buildChunkTaskDescription(chunk, outputs);

      // Create wrapped streaming config that adds chunk progress info
      const wrappedStreaming: StreamingConfig | undefined = streaming
        ? {
            onChunk: streaming.onChunk,
            onProgress: streaming.onProgress
              ? (progress: ProgressInfo) => {
                  // Enhance progress with chunk information
                  streaming.onProgress?.({
                    ...progress,
                    chunkProgress: {
                      currentChunk: chunk.index + 1,
                      totalChunks,
                      currentChunkDescription: chunk.description,
                    },
                  });
                }
              : undefined,
            progressIntervalMs: streaming.progressIntervalMs,
          }
        : undefined;

      const result = await executeCodex(
        codexPath,
        chunkTask,
        workingDir,
        chunkTimeout,
        `${sessionId}_chunk_${chunk.index}`,
        sessionDir,
        wrappedStreaming,
      );

      outputs.push({
        chunkId: chunk.id,
        success: result.success,
        output: result.output,
        error: result.error,
      });

      if (result.success) {
        completedChunks++;
      } else {
        errors.push(`Chunk ${chunk.index + 1}/${totalChunks} failed: ${result.error}`);
        // Continue with remaining chunks even if one fails
      }
    }
  }

  // Aggregate outputs
  const aggregatedOutput = outputs
    .filter((o) => o.success)
    .map((o) => o.output)
    .join("\n\n---\n\n");

  return {
    success: completedChunks === totalChunks,
    completedChunks,
    totalChunks,
    outputs,
    aggregatedOutput,
    errors,
  };
}

/**
 * Build task description for a chunk with context from previous chunks
 */
function buildChunkTaskDescription(
  chunk: TaskChunk,
  previousOutputs: ChunkedExecutionResult["outputs"],
): string {
  const parts: string[] = [];

  // Main task
  parts.push(chunk.description);

  // Add context from dependencies
  if (chunk.dependencies.length > 0 && previousOutputs.length > 0) {
    const depOutputs = previousOutputs.filter(
      (o) => chunk.dependencies.includes(o.chunkId) && o.success,
    );

    if (depOutputs.length > 0) {
      parts.push("\n\n## Context from previous steps:");
      for (const dep of depOutputs) {
        // Extract summary from output (first few lines or key events)
        const summary = extractChunkSummary(dep.output);
        if (summary) {
          parts.push(`- Previous step completed: ${summary}`);
        }
      }
    }
  }

  // Add file context if available
  if (chunk.context.files && chunk.context.files.length > 0) {
    parts.push(`\n\nRelevant files: ${chunk.context.files.join(", ")}`);
  }

  return parts.join("");
}

/**
 * Extract summary from chunk output
 */
function extractChunkSummary(output: string): string {
  // Try to extract from JSONL events
  try {
    const lines = output.trim().split("\n");
    for (const line of lines.slice(-10)) {
      try {
        const event = JSON.parse(line) as ParsedCodexEvent;
        if (event.type === "turn.completed") {
          const turnEvent = event as TurnCompletedEvent;
          if (turnEvent.summary) {
            return turnEvent.summary;
          }
        }
      } catch {
        // Not JSON, ignore
      }
    }
  } catch {
    // Fallback: return first line
  }

  // Fallback: first meaningful line
  const firstLine = output.trim().split("\n")[0];
  return firstLine ? firstLine.substring(0, 100) : "completed";
}

/**
 * Get or create handoff file
 */
function getOrCreateHandoff(handoffPath: string, workingDir: string): HandoffFile {
  const fullPath = join(workingDir, handoffPath);

  if (existsSync(fullPath)) {
    try {
      const content = readFileSync(fullPath, "utf-8");
      return parseHandoffFile(content);
    } catch {
      // Create new if parse fails
    }
  }

  return createHandoffFile("claude", {
    path: workingDir,
  });
}

/**
 * Save handoff file
 */
function saveHandoff(handoff: HandoffFile, handoffPath: string, workingDir: string): void {
  const fullPath = join(workingDir, handoffPath);
  const dir = dirname(fullPath);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(fullPath, serializeHandoffFile(handoff), "utf-8");
}

/**
 * Ensure directory exists
 */
function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Normalize input data from different formats
 */
function normalizeCodexDelegateInput(inputData: unknown): CodexDelegateInput {
  const hasContext = inputData && typeof inputData === "object" && "context" in inputData;
  return (
    hasContext ? (inputData as { context: CodexDelegateInput }).context : inputData
  ) as CodexDelegateInput;
}

/**
 * Handle configure operation
 */
function handleConfigureOperation(operation: string, configPath: string): CodexDelegateOutput {
  const config = readCodexConfig(configPath);
  const detectedPath = detectCodexPath();

  return {
    success: true,
    operation,
    codexPath: detectedPath,
    config: config
      ? {
          model: config.model,
          provider: config.provider,
          approvalMode: config.approval_mode,
        }
      : undefined,
  };
}

// ============================================================================
// Extracted Helper Functions for handleStatusOperation
// Pattern: Extract Method (Refactoring.Guru)
// Purpose: Reduce cognitive complexity from 20 to ~8
// ============================================================================

/**
 * Live status structure from status file
 */
interface LiveStatus {
  status: "running" | "completed" | "failed" | "timeout";
  timestamp: string;
  details?: string;
}

/**
 * Try to read live status from status file
 * @returns LiveStatus if file exists and parses, undefined otherwise
 */
function tryReadLiveStatus(statusFile: string): LiveStatus | undefined {
  if (!existsSync(statusFile)) {
    return undefined;
  }
  try {
    const statusContent = readFileSync(statusFile, "utf-8");
    return JSON.parse(statusContent) as LiveStatus;
  } catch {
    logger.debug({ statusFile }, "Failed to parse status file");
    return undefined;
  }
}

/**
 * Build response when we have live status but no session file
 */
function buildLiveStatusOnlyResponse(
  operation: string,
  sessionId: string,
  liveStatus: LiveStatus,
  outputLog: string,
  statusFile: string,
): CodexDelegateOutput {
  return {
    success: true,
    operation,
    sessionId,
    liveStatus,
    logFile: existsSync(outputLog) ? outputLog : undefined,
    statusFile: existsSync(statusFile) ? statusFile : undefined,
    summary: `Live Status: ${liveStatus.status}${liveStatus.details ? ` - ${liveStatus.details}` : ""}`,
  };
}

/**
 * Build full status response with handoff data
 */
function buildFullStatusResponse(
  operation: string,
  handoff: HandoffFile,
  liveStatus: LiveStatus | undefined,
  outputLog: string,
  statusFile: string,
): CodexDelegateOutput {
  const handoffStatus = handoff.session.status;
  const effectiveStatus = liveStatus?.status || handoffStatus;

  return {
    success: true,
    operation,
    sessionId: handoff.session.id,
    liveStatus,
    logFile: existsSync(outputLog) ? outputLog : undefined,
    statusFile: existsSync(statusFile) ? statusFile : undefined,
    summary: `Status: ${effectiveStatus}, Tasks: ${handoff.tasks.length}${liveStatus ? ` (Live: ${liveStatus.status})` : ""}`,
  };
}

/**
 * Handle status operation - now reads from live status file as well
 *
 * REFACTORED: Complexity reduced from 20 to ~8 using Extract Method pattern
 * Source: https://refactoring.guru/extract-method
 */
function handleStatusOperation(
  operation: string,
  sessionId: string | undefined,
  sessionDir: string,
): CodexDelegateOutput {
  // Guard clause: validate sessionId
  if (!sessionId) {
    return {
      success: false,
      operation,
      error: "Session ID required for status operation",
    };
  }

  const sessionPath = join(sessionDir, `${sessionId}.json`);
  const { outputLog, statusFile } = getSessionLogPaths(sessionDir, sessionId);

  // Try to read live status (extracted method)
  const liveStatus = tryReadLiveStatus(statusFile);

  // Handle case: no session file exists
  if (!existsSync(sessionPath)) {
    if (liveStatus) {
      return buildLiveStatusOnlyResponse(operation, sessionId, liveStatus, outputLog, statusFile);
    }
    return {
      success: false,
      operation,
      error: `Session not found: ${sessionId}`,
    };
  }

  // Parse session file and build full response
  const sessionContent = readFileSync(sessionPath, "utf-8");
  const handoff = parseHandoffFile(sessionContent);

  return buildFullStatusResponse(operation, handoff, liveStatus, outputLog, statusFile);
}

/**
 * Handle resume operation
 */
async function handleResumeOperation(
  operation: string,
  sessionId: string | undefined,
  sessionDir: string,
  outputDir: string,
  codexPath: string | undefined,
  workingDir: string,
  timeout: number,
): Promise<CodexDelegateOutput> {
  if (!sessionId) {
    return {
      success: false,
      operation,
      error: "Session ID required for resume operation",
    };
  }

  const sessionPath = join(sessionDir, `${sessionId}.json`);
  if (!existsSync(sessionPath)) {
    return {
      success: false,
      operation,
      error: `Session not found: ${sessionId}`,
    };
  }

  const sessionContent = readFileSync(sessionPath, "utf-8");
  let handoff = parseHandoffFile(sessionContent);
  const pendingTask = handoff.tasks.find(
    (t) => t.status === "pending" || t.status === "in_progress",
  );

  if (!pendingTask) {
    return {
      success: true,
      operation,
      sessionId,
      summary: "No pending tasks to resume",
    };
  }

  handoff = updateSessionStatus(handoff, "active");
  handoff = updateTask(handoff, pendingTask.id, { status: "in_progress" });

  if (!codexPath) {
    return {
      success: false,
      operation,
      error: "Codex CLI not found. Install with: npm install -g @openai/codex",
      recoveryHint: "Install Codex CLI or provide codexPath parameter",
    };
  }

  ensureDir(outputDir);
  const result = await executeCodex(
    codexPath,
    pendingTask.description,
    workingDir,
    timeout,
    sessionId,
    sessionDir,
  );

  // Get log file paths
  const { outputLog, statusFile: statusFilePath } = getSessionLogPaths(sessionDir, sessionId);

  if (result.success) {
    const events = parseJsonlEvents(result.output);
    handoff = updateTask(handoff, pendingTask.id, {
      status: "completed",
      outputContext: {
        filesModified: [],
        filesCreated: [],
        summary: extractSummary(events),
        notes: [],
        errors: [],
      },
    });

    writeFileSync(sessionPath, serializeHandoffFile(handoff), "utf-8");

    return {
      success: true,
      operation,
      sessionId,
      logFile: existsSync(outputLog) ? outputLog : undefined,
      statusFile: existsSync(statusFilePath) ? statusFilePath : undefined,
      events: events.map((e) => ({ type: e.type, timestamp: e.timestamp })),
      summary: extractSummary(events),
    };
  }

  handoff = updateTask(handoff, pendingTask.id, {
    status: "failed",
    outputContext: {
      filesModified: [],
      filesCreated: [],
      notes: [],
      errors: [result.error || "Unknown error"],
    },
  });
  writeFileSync(sessionPath, serializeHandoffFile(handoff), "utf-8");

  return {
    success: false,
    operation,
    sessionId,
    error: result.error,
    recoveryHint: "Check Codex logs or retry with different parameters",
  };
}

// ============================================================================
// Extracted Helper Functions for handleDelegateOperation
// Pattern: Extract Method (Refactoring.Guru)
// Purpose: Reduce cognitive complexity from 29 to ~10
// ============================================================================

/**
 * Context for delegation task
 */
interface TaskContext {
  files?: string[];
  requirements?: string;
  constraints?: string[];
}

/**
 * Execution result from Codex
 */
interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  logFile?: string;
}

/**
 * Validate required delegation parameters
 * @returns Error response if validation fails, null if valid
 */
function validateDelegationParams(
  task: string | undefined,
  codexPath: string | undefined,
  operation: string,
): CodexDelegateOutput | null {
  if (!task) {
    return {
      success: false,
      operation,
      error: "Task description required for delegation",
    };
  }
  if (!codexPath) {
    return {
      success: false,
      operation,
      error: "Codex CLI not found. Install with: npm install -g @openai/codex",
      recoveryHint: "Install Codex CLI or provide codexPath parameter",
    };
  }
  return null;
}

/**
 * Determine if chunking should be used and get chunking result
 */
function determineChunking(
  task: string,
  enableChunking: boolean,
  timeout: number,
  maxChunkDurationMs: number,
): { useChunking: boolean; chunkingResult: ChunkingResult | null } {
  if (!enableChunking || !needsChunking(task, timeout)) {
    return { useChunking: false, chunkingResult: null };
  }

  const chunkingResult = chunkTask(task, {
    maxChunkDurationMs,
    complexityThreshold: 50,
  });

  return {
    useChunking: chunkingResult.requiresChunking,
    chunkingResult,
  };
}

/**
 * Add task to handoff based on chunking decision
 */
function addTaskToHandoff(
  handoff: HandoffFile,
  task: string,
  useChunking: boolean,
  chunkingResult: ChunkingResult | null,
  context?: TaskContext,
): HandoffFile {
  const taskDescription = useChunking && chunkingResult ? `[CHUNKED] ${task}` : task;

  const requirements =
    useChunking && chunkingResult
      ? `Chunked into ${chunkingResult.chunks.length} subtasks. ${context?.requirements || ""}`
      : context?.requirements;

  return addTask(handoff, {
    description: taskDescription,
    assignedTo: "codex",
    priority: "medium",
    inputContext: {
      files: context?.files || [],
      codeSnippets: [],
      requirements,
      constraints: context?.constraints || [],
      dependencies: [],
    },
  });
}

/**
 * Execute task with or without chunking
 */
async function executeWithStrategy(
  codexPath: string,
  task: string,
  workingDir: string,
  sessionId: string,
  sessionDir: string,
  timeout: number,
  maxChunkDurationMs: number,
  useChunking: boolean,
  chunkingResult: ChunkingResult | null,
): Promise<{ result: ExecutionResult; chunkingInfo: CodexDelegateOutput["chunking"] }> {
  if (useChunking && chunkingResult) {
    const chunkedResult = await executeChunkedTask(
      codexPath,
      chunkingResult,
      workingDir,
      maxChunkDurationMs,
      sessionId,
      sessionDir,
    );

    return {
      result: {
        success: chunkedResult.success,
        output: chunkedResult.aggregatedOutput,
        error:
          chunkedResult.errors.length > 0
            ? `${chunkedResult.completedChunks}/${chunkedResult.totalChunks} chunks completed. Errors: ${chunkedResult.errors.join("; ")}`
            : undefined,
      },
      chunkingInfo: {
        enabled: true,
        totalChunks: chunkedResult.totalChunks,
        completedChunks: chunkedResult.completedChunks,
        complexityScore: chunkingResult.complexity.score,
      },
    };
  }

  const result = await executeCodex(codexPath, task, workingDir, timeout, sessionId, sessionDir);

  return {
    result,
    chunkingInfo: {
      enabled: false,
      totalChunks: 1,
      completedChunks: result.success ? 1 : 0,
      complexityScore: 0,
    },
  };
}

/**
 * Build success response for delegation
 */
function buildDelegateSuccessResponse(
  operation: string,
  handoff: HandoffFile,
  result: ExecutionResult,
  chunkingInfo: CodexDelegateOutput["chunking"],
  outputLog: string,
  statusFilePath: string,
  handoffPath: string,
  workingDir: string,
): CodexDelegateOutput {
  const events = parseJsonlEvents(result.output);

  return {
    success: true,
    operation,
    sessionId: handoff.session.id,
    logFile: existsSync(outputLog) ? outputLog : undefined,
    statusFile: existsSync(statusFilePath) ? statusFilePath : undefined,
    events: events.map((e) => ({ type: e.type, timestamp: e.timestamp })),
    summary: extractSummary(events),
    handoffFile: join(workingDir, handoffPath),
    chunking: chunkingInfo,
  };
}

/**
 * Build failure response for delegation
 */
function buildDelegateFailureResponse(
  operation: string,
  handoff: HandoffFile,
  result: ExecutionResult,
  chunkingInfo: CodexDelegateOutput["chunking"],
  outputLog: string,
  statusFilePath: string,
  handoffPath: string,
  workingDir: string,
): CodexDelegateOutput {
  return {
    success: false,
    operation,
    sessionId: handoff.session.id,
    logFile: existsSync(outputLog) ? outputLog : undefined,
    statusFile: existsSync(statusFilePath) ? statusFilePath : undefined,
    error: result.error,
    recoveryHint: `Check log file for details: ${outputLog}`,
    handoffFile: join(workingDir, handoffPath),
    chunking: chunkingInfo,
  };
}

/**
 * Handle delegate operation with P2 chunking support
 *
 * REFACTORED: Complexity reduced from 29 to ~10 using Extract Method pattern
 * Source: https://refactoring.guru/extract-method
 */
async function handleDelegateOperation(
  operation: string,
  task: string | undefined,
  codexPath: string | undefined,
  handoffPath: string,
  workingDir: string,
  sessionDir: string,
  outputDir: string,
  timeout: number,
  enableChunking: boolean,
  maxChunkDurationMs: number,
  context?: TaskContext,
): Promise<CodexDelegateOutput> {
  // 1. Validate parameters (Guard Clauses)
  const validationError = validateDelegationParams(task, codexPath, operation);
  if (validationError) {
    return validationError;
  }

  // After validation, task and codexPath are guaranteed to be defined
  const validatedTask = task as string;
  const validatedCodexPath = codexPath as string;

  // 2. Determine chunking strategy
  const { useChunking, chunkingResult } = determineChunking(
    validatedTask,
    enableChunking,
    timeout,
    maxChunkDurationMs,
  );

  // 3. Initialize handoff
  let handoff = getOrCreateHandoff(handoffPath, workingDir);
  handoff = updateSessionStatus(handoff, "active");
  handoff = addTaskToHandoff(handoff, validatedTask, useChunking, chunkingResult, context);

  const currentTask = handoff.tasks[handoff.tasks.length - 1];
  if (!currentTask) {
    return { success: false, operation, error: "Failed to create task" };
  }

  handoff = updateTask(handoff, currentTask.id, { status: "in_progress" });

  // 4. Persist handoff state
  saveHandoff(handoff, handoffPath, workingDir);
  ensureDir(sessionDir);
  const sessionPath = join(sessionDir, `${handoff.session.id}.json`);
  writeFileSync(sessionPath, serializeHandoffFile(handoff), "utf-8");
  ensureDir(outputDir);

  // 5. Execute task
  const { result, chunkingInfo } = await executeWithStrategy(
    validatedCodexPath,
    validatedTask,
    workingDir,
    handoff.session.id,
    sessionDir,
    timeout,
    maxChunkDurationMs,
    useChunking,
    chunkingResult,
  );

  // 6. Get log paths
  const { outputLog, statusFile: statusFilePath } = getSessionLogPaths(
    sessionDir,
    handoff.session.id,
  );

  // 7. Update handoff and return response
  if (result.success) {
    const events = parseJsonlEvents(result.output);
    handoff = updateTask(handoff, currentTask.id, {
      status: "completed",
      outputContext: {
        filesModified: [],
        filesCreated: [],
        summary: extractSummary(events),
        notes: [],
        errors: [],
      },
    });
    handoff = updateSessionStatus(handoff, "completed");
    saveHandoff(handoff, handoffPath, workingDir);
    writeFileSync(sessionPath, serializeHandoffFile(handoff), "utf-8");

    return buildDelegateSuccessResponse(
      operation,
      handoff,
      result,
      chunkingInfo,
      outputLog,
      statusFilePath,
      handoffPath,
      workingDir,
    );
  }

  // 8. Handle failure
  handoff = updateTask(handoff, currentTask.id, {
    status: "failed",
    outputContext: {
      filesModified: [],
      filesCreated: [],
      notes: [],
      errors: [result.error || "Unknown error"],
    },
  });
  handoff = updateSessionStatus(handoff, "failed");
  saveHandoff(handoff, handoffPath, workingDir);
  writeFileSync(sessionPath, serializeHandoffFile(handoff), "utf-8");

  return buildDelegateFailureResponse(
    operation,
    handoff,
    result,
    chunkingInfo,
    outputLog,
    statusFilePath,
    handoffPath,
    workingDir,
  );
}

export const codexDelegateTool = createTool({
  id: "codex-delegate",
  description:
    "Delegate tasks to OpenAI Codex CLI with proper context handoff. Supports delegation, session resume, status checks, and configuration.",
  inputSchema,
  outputSchema,
  execute: async (inputData): Promise<CodexDelegateOutput> => {
    const input = normalizeCodexDelegateInput(inputData);

    const defaults = getDefaultPaths();
    const {
      operation,
      task,
      workingDir = process.cwd(),
      codexPath = detectCodexPath() || defaults.codexPath,
      configPath = defaults.configPath,
      outputDir = defaults.outputDir,
      sessionDir = defaults.sessionDir,
      handoffPath = defaults.handoffPath,
      sessionId,
      timeout = 600000,
      enableChunking = true,
      maxChunkDurationMs = 180000,
      context,
    } = input;

    try {
      if (operation === "configure") {
        return handleConfigureOperation(operation, configPath);
      }

      if (operation === "status") {
        return handleStatusOperation(operation, sessionId, sessionDir);
      }

      if (operation === "resume") {
        return await handleResumeOperation(
          operation,
          sessionId,
          sessionDir,
          outputDir,
          codexPath,
          workingDir,
          timeout,
        );
      }

      if (operation === "delegate") {
        return await handleDelegateOperation(
          operation,
          task,
          codexPath,
          handoffPath,
          workingDir,
          sessionDir,
          outputDir,
          timeout,
          enableChunking,
          maxChunkDurationMs,
          context,
        );
      }

      return {
        success: false,
        operation,
        error: `Unknown operation: ${operation}`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        operation,
        error: message,
        recoveryHint: "Use heal-error tool for recovery suggestions",
      };
    }
  },
});

/**
 * Codex Delegate Tool
 *
 * Enables delegation of tasks to OpenAI Codex CLI with proper context handoff.
 * Supports configurable paths, session management, and error recovery.
 */

import { execSync, spawn } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
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
    .default(300000)
    .describe("Timeout in milliseconds (default: 5 minutes)"),
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
 * Execute Codex CLI with JSON output and real-time logging
 */
async function executeCodex(
  codexPath: string,
  task: string,
  workingDir: string,
  timeout: number,
  sessionId?: string,
  sessionDir?: string,
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

    proc.stdout?.on("data", (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;

      // Real-time logging to file
      if (logFile) {
        appendToLog(logFile, chunk);
      }
    });

    proc.stderr?.on("data", (data: Buffer) => {
      const chunk = data.toString();
      errorOutput += chunk;

      // Real-time logging to file (stderr)
      if (logFile) {
        appendToLog(logFile, `[STDERR] ${chunk}`);
      }
    });

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

/**
 * Handle status operation - now reads from live status file as well
 */
function handleStatusOperation(
  operation: string,
  sessionId: string | undefined,
  sessionDir: string,
): CodexDelegateOutput {
  if (!sessionId) {
    return {
      success: false,
      operation,
      error: "Session ID required for status operation",
    };
  }

  const sessionPath = join(sessionDir, `${sessionId}.json`);
  const { outputLog, statusFile } = getSessionLogPaths(sessionDir, sessionId);

  // Check for live status file first (more up-to-date)
  let liveStatus:
    | {
        status: "running" | "completed" | "failed" | "timeout";
        timestamp: string;
        details?: string;
      }
    | undefined;
  if (existsSync(statusFile)) {
    try {
      const statusContent = readFileSync(statusFile, "utf-8");
      liveStatus = JSON.parse(statusContent);
    } catch {
      // Ignore parse errors
    }
  }

  // Check for session JSON file
  if (!existsSync(sessionPath)) {
    // If we have a live status but no session file, still return info
    if (liveStatus) {
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
    return {
      success: false,
      operation,
      error: `Session not found: ${sessionId}`,
    };
  }

  const sessionContent = readFileSync(sessionPath, "utf-8");
  const handoff = parseHandoffFile(sessionContent);

  // Combine handoff status with live status
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

/**
 * Handle delegate operation
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
  context?: {
    files?: string[];
    requirements?: string;
    constraints?: string[];
  },
): Promise<CodexDelegateOutput> {
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

  let handoff = getOrCreateHandoff(handoffPath, workingDir);
  handoff = updateSessionStatus(handoff, "active");
  handoff = addTask(handoff, {
    description: task,
    assignedTo: "codex",
    priority: "medium",
    inputContext: {
      files: context?.files || [],
      codeSnippets: [],
      requirements: context?.requirements,
      constraints: context?.constraints || [],
      dependencies: [],
    },
  });

  const currentTask = handoff.tasks[handoff.tasks.length - 1];
  if (!currentTask) {
    return {
      success: false,
      operation,
      error: "Failed to create task",
    };
  }

  handoff = updateTask(handoff, currentTask.id, { status: "in_progress" });

  saveHandoff(handoff, handoffPath, workingDir);

  ensureDir(sessionDir);
  const sessionPath = join(sessionDir, `${handoff.session.id}.json`);
  writeFileSync(sessionPath, serializeHandoffFile(handoff), "utf-8");

  ensureDir(outputDir);

  const result = await executeCodex(
    codexPath,
    task,
    workingDir,
    timeout,
    handoff.session.id,
    sessionDir,
  );

  // Get log file paths
  const { outputLog, statusFile: statusFilePath } = getSessionLogPaths(
    sessionDir,
    handoff.session.id,
  );

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

    return {
      success: true,
      operation,
      sessionId: handoff.session.id,
      logFile: existsSync(outputLog) ? outputLog : undefined,
      statusFile: existsSync(statusFilePath) ? statusFilePath : undefined,
      events: events.map((e) => ({ type: e.type, timestamp: e.timestamp })),
      summary: extractSummary(events),
      handoffFile: join(workingDir, handoffPath),
    };
  }

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

  return {
    success: false,
    operation,
    sessionId: handoff.session.id,
    logFile: existsSync(outputLog) ? outputLog : undefined,
    statusFile: existsSync(statusFilePath) ? statusFilePath : undefined,
    error: result.error,
    recoveryHint: `Check log file for details: ${outputLog}`,
    handoffFile: join(workingDir, handoffPath),
  };
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
      timeout = 300000,
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

/**
 * Codex Operations
 *
 * Handler functions for each Codex operation type.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  addTask,
  parseHandoffFile,
  serializeHandoffFile,
  updateSessionStatus,
  updateTask,
} from "../handoff-protocol.js";
import { type ChunkingResult, chunkTask, needsChunking } from "../task-chunker.js";
import { detectCodexPath, getSessionLogPaths, readCodexConfig } from "./config.js";
import { extractSummary, parseJsonlEvents } from "./events.js";
import { executeChunkedTask, executeCodex } from "./executor.js";
import {
  buildFullStatusResponse,
  buildLiveStatusOnlyResponse,
  ensureDir,
  getOrCreateHandoff,
  saveHandoff,
  tryReadLiveStatus,
} from "./session.js";
import type { CodexDelegateOutput, ExecutionResult, TaskContext } from "./types.js";

/**
 * Handle configure operation
 */
export function handleConfigureOperation(
  operation: string,
  configPath: string,
): CodexDelegateOutput {
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
 * Handle status operation
 */
export function handleStatusOperation(
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

  const liveStatus = tryReadLiveStatus(statusFile);

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

  const sessionContent = readFileSync(sessionPath, "utf-8");
  const handoff = parseHandoffFile(sessionContent);

  return buildFullStatusResponse(operation, handoff, liveStatus, outputLog, statusFile);
}

/**
 * Handle resume operation
 */
export async function handleResumeOperation(
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
 * Validate required delegation parameters
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
 * Determine if chunking should be used
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
 * Handle delegate operation with chunking support
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Orchestrates delegation with validation, chunking, handoff, and execution
export async function handleDelegateOperation(
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
  const validationError = validateDelegationParams(task, codexPath, operation);
  if (validationError) {
    return validationError;
  }

  const validatedTask = task as string;
  const validatedCodexPath = codexPath as string;

  const { useChunking, chunkingResult } = determineChunking(
    validatedTask,
    enableChunking,
    timeout,
    maxChunkDurationMs,
  );

  let handoff = getOrCreateHandoff(handoffPath, workingDir);
  handoff = updateSessionStatus(handoff, "active");

  const taskDescription =
    useChunking && chunkingResult ? `[CHUNKED] ${validatedTask}` : validatedTask;
  const requirements =
    useChunking && chunkingResult
      ? `Chunked into ${chunkingResult.chunks.length} subtasks. ${context?.requirements || ""}`
      : context?.requirements;

  handoff = addTask(handoff, {
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

  const currentTask = handoff.tasks[handoff.tasks.length - 1];
  if (!currentTask) {
    return { success: false, operation, error: "Failed to create task" };
  }

  handoff = updateTask(handoff, currentTask.id, { status: "in_progress" });

  saveHandoff(handoff, handoffPath, workingDir);
  ensureDir(sessionDir);
  const sessionPath = join(sessionDir, `${handoff.session.id}.json`);
  writeFileSync(sessionPath, serializeHandoffFile(handoff), "utf-8");
  ensureDir(outputDir);

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
      chunking: chunkingInfo,
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
    chunking: chunkingInfo,
  };
}

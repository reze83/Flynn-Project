/**
 * Codex Executor
 *
 * Handles execution of Codex CLI with streaming support and chunked execution.
 */

import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import type { TaskChunk } from "../chunking/types.js";
import type { ChunkingResult } from "../task-chunker.js";
import { getSessionLogPaths } from "./config.js";
import { extractChunkSummary } from "./events.js";
import { appendToLog, writeStatusFile } from "./session.js";
import type {
  ChunkedExecutionResult,
  ExecutionResult,
  ParsedCodexEvent,
  ProgressInfo,
  StreamingConfig,
} from "./types.js";

/**
 * Execute Codex CLI with JSON output, real-time logging, and streaming support
 */
export async function executeCodex(
  codexPath: string,
  task: string,
  workingDir: string,
  timeout: number,
  sessionId?: string,
  sessionDir?: string,
  streaming?: StreamingConfig,
): Promise<ExecutionResult> {
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

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Event-driven callback with shared mutable state
    proc.stdout?.on("data", (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;

      // Real-time logging to file
      if (logFile) {
        appendToLog(logFile, chunk);
      }

      // Streaming: Parse and emit events
      if (streaming?.onChunk) {
        const lines = chunk.split("\n").filter((line) => line.trim());
        for (const line of lines) {
          try {
            const event = JSON.parse(line) as ParsedCodexEvent;
            eventsReceived++;
            lastEventType = event.type;

            if (event.type === "turn.started") {
              turnCount++;
            }

            streaming.onChunk(line, event);
          } catch {
            streaming.onChunk(line);
          }
        }
      }

      emitProgress("running");
    });

    proc.stderr?.on("data", (data: Buffer) => {
      const chunk = data.toString();
      errorOutput += chunk;

      if (logFile) {
        appendToLog(logFile, `[STDERR] ${chunk}`);
      }

      if (streaming?.onChunk) {
        streaming.onChunk(`[STDERR] ${chunk}`);
      }
    });

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Event callback handling completion with status updates and logging
    proc.on("close", (code) => {
      clearTimeout(timeoutId);
      const success = code === 0;

      if (statusFile) {
        writeStatusFile(
          statusFile,
          success ? "completed" : "failed",
          success ? "Task completed successfully" : `Exit code: ${code}`,
        );
      }

      if (logFile) {
        appendToLog(logFile, `\n\n=== ${success ? "COMPLETED" : "FAILED"} ===\n`);
        appendToLog(logFile, `Exit code: ${code}\n`);
        appendToLog(logFile, `Finished: ${new Date().toISOString()}\n`);
      }

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

      if (statusFile) {
        writeStatusFile(statusFile, "failed", err.message);
      }

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
 * Build task description for a chunk with context from previous chunks
 */
export function buildChunkTaskDescription(
  chunk: TaskChunk,
  previousOutputs: ChunkedExecutionResult["outputs"],
): string {
  const parts: string[] = [];

  parts.push(chunk.description);

  if (chunk.dependencies.length > 0 && previousOutputs.length > 0) {
    const depOutputs = previousOutputs.filter(
      (o) => chunk.dependencies.includes(o.chunkId) && o.success,
    );

    if (depOutputs.length > 0) {
      parts.push("\n\n## Context from previous steps:");
      for (const dep of depOutputs) {
        const summary = extractChunkSummary(dep.output);
        if (summary) {
          parts.push(`- Previous step completed: ${summary}`);
        }
      }
    }
  }

  if (chunk.context.files && chunk.context.files.length > 0) {
    parts.push(`\n\nRelevant files: ${chunk.context.files.join(", ")}`);
  }

  return parts.join("");
}

/**
 * Execute a task in chunks with dependency ordering and streaming support
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Orchestrates chunked execution with dependency tracking and streaming
export async function executeChunkedTask(
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

  for (const group of chunkingResult.executionOrder) {
    for (const chunkId of group) {
      const chunk = chunkingResult.chunks.find((c) => c.id === chunkId);
      if (!chunk) continue;

      const chunkTask = buildChunkTaskDescription(chunk, outputs);

      const wrappedStreaming: StreamingConfig | undefined = streaming
        ? {
            onChunk: streaming.onChunk,
            onProgress: streaming.onProgress
              ? (progress: ProgressInfo) => {
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
      }
    }
  }

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

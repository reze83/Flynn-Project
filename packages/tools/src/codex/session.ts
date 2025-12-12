/**
 * Codex Session Management
 *
 * Handles session persistence, status tracking, and handoff file management.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createLogger } from "@flynn/core";

import {
  type HandoffFile,
  createHandoffFile,
  parseHandoffFile,
  serializeHandoffFile,
} from "../handoff-protocol.js";
import type { CodexDelegateOutput, LiveStatus } from "./types.js";

const logger = createLogger("codex-session");

/**
 * Write status to file for external monitoring
 */
export function writeStatusFile(
  statusFile: string,
  status: "running" | "completed" | "failed" | "timeout",
  details?: string,
): void {
  const statusData: LiveStatus = {
    status,
    timestamp: new Date().toISOString(),
    details,
  };
  writeFileSync(statusFile, JSON.stringify(statusData, null, 2), "utf-8");
}

/**
 * Append to output log file for real-time monitoring
 */
export function appendToLog(logFile: string, data: string): void {
  appendFileSync(logFile, data);
}

/**
 * Ensure directory exists
 */
export function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Get or create handoff file
 */
export function getOrCreateHandoff(handoffPath: string, workingDir: string): HandoffFile {
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
export function saveHandoff(handoff: HandoffFile, handoffPath: string, workingDir: string): void {
  const fullPath = join(workingDir, handoffPath);
  const dir = dirname(fullPath);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(fullPath, serializeHandoffFile(handoff), "utf-8");
}

/**
 * Try to read live status from status file
 */
export function tryReadLiveStatus(statusFile: string): LiveStatus | undefined {
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
export function buildLiveStatusOnlyResponse(
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
export function buildFullStatusResponse(
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

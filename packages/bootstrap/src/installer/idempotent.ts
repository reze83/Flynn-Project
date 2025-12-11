/**
 * Idempotent installation helpers
 */

import { type ExecSyncOptions, execSync } from "node:child_process";
import { createLogger } from "@flynn/core";

const logger = createLogger("installer");

const defaultExecOptions: ExecSyncOptions = {
  encoding: "utf-8",
  timeout: 120000, // 2 minutes
  stdio: "pipe",
};

/**
 * Check if a command exists
 */
export function commandExists(command: string): boolean {
  try {
    execSync(`which ${command}`, { ...defaultExecOptions, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get command version
 */
export function getCommandVersion(command: string, versionFlag = "--version"): string | null {
  try {
    const output = execSync(`${command} ${versionFlag}`, defaultExecOptions);
    return (output as string).trim().split("\n")[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Run a shell command with logging
 */
export function runCommand(
  command: string,
  options?: ExecSyncOptions,
): { success: boolean; output: string; error?: string } {
  logger.debug({ command }, "Running command");

  try {
    const output = execSync(command, {
      ...defaultExecOptions,
      ...options,
    });
    return { success: true, output: (output as string).trim() };
  } catch (error) {
    const err = error as { message?: string; stderr?: Buffer };
    const errorMessage = err.stderr?.toString() || err.message || "Unknown error";
    logger.error({ command, error: errorMessage }, "Command failed");
    return { success: false, output: "", error: errorMessage };
  }
}

/**
 * Check version meets minimum
 */
export function meetsMinimumVersion(current: string, minimum: string): boolean {
  const parseVersion = (v: string): number[] => {
    const match = v.match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
    if (!match) return [0, 0, 0];
    return [
      Number.parseInt(match[1] || "0", 10),
      Number.parseInt(match[2] || "0", 10),
      Number.parseInt(match[3] || "0", 10),
    ];
  };

  const curr = parseVersion(current);
  const min = parseVersion(minimum);

  for (let i = 0; i < 3; i++) {
    const currVal = curr[i] ?? 0;
    const minVal = min[i] ?? 0;
    if (currVal > minVal) return true;
    if (currVal < minVal) return false;
  }
  return true;
}

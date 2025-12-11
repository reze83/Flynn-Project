/**
 * Anthropic Bash Tool Wrapper with Flynn Policy Enforcement
 * Validates commands against flynn.policy.yaml before execution
 */

import { execSync } from "node:child_process";
import { anthropic } from "@ai-sdk/anthropic";
import { loadPolicy, validateCommand, validatePath } from "@flynn/core";
import { createLogger } from "@flynn/core";
import { recordToolMetric } from "./metrics.js";

const logger = createLogger("anthropic-bash");

interface BashResult {
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  error?: string;
  metrics?: {
    durationMs: number;
    blocked?: boolean;
  };
  blockedCommand?: string;
}

/**
 * Execute a shell command safely with timeout and policy enforcement
 */
async function executeShellSafe(
  command: string,
  options: { timeout?: number; cwd?: string } = {},
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const { timeout = 30000, cwd = process.cwd() } = options;

  try {
    const stdout = execSync(command, {
      encoding: "utf-8",
      timeout,
      cwd,
      maxBuffer: 5 * 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"],
    });

    return {
      stdout: stdout.trim(),
      stderr: "",
      exitCode: 0,
    };
  } catch (error) {
    const execError = error as {
      stdout?: Buffer | string;
      stderr?: Buffer | string;
      status?: number;
    };

    return {
      stdout: String(execError.stdout || "").trim(),
      stderr: String(execError.stderr || "").trim(),
      exitCode: execError.status ?? 1,
    };
  }
}

/**
 * Anthropic Bash Tool with Flynn Policy Enforcement
 * Checks commands against flynn.policy.yaml before execution
 */
export const flynnBashTool = anthropic.tools.bash_20241022({
  execute: async ({
    command,
    restart,
  }: { command: string; restart?: boolean }): Promise<BashResult> => {
    const trimmedCommand = command.trim();
    const started = Date.now();
    logger.debug({ command: trimmedCommand, restart }, "Bash tool invoked");

    // Load policy and validate command
    const policy = loadPolicy();
    const validation = validateCommand(trimmedCommand, policy);
    const cwdCheck = validatePath(process.cwd(), "write", policy);

    if (!validation.allowed || !cwdCheck.allowed) {
      logger.warn(
        { command: trimmedCommand, reason: validation.reason || cwdCheck.reason },
        "Command blocked by policy",
      );

      return {
        error: `Blocked by flynn.policy.yaml: ${validation.reason || cwdCheck.reason}`,
        blockedCommand: trimmedCommand,
        metrics: { durationMs: Date.now() - started, blocked: true },
      };
    }

    // Execute command safely
    try {
      const effectiveTimeout = Math.min(policy.agents.timeout_seconds * 1000, 120_000);
      const result = await executeShellSafe(trimmedCommand, {
        timeout: effectiveTimeout,
        cwd: process.cwd(),
      });

      logger.debug(
        { command: trimmedCommand, exitCode: result.exitCode, durationMs: Date.now() - started },
        "Command executed",
      );

      recordToolMetric({
        tool: "bash",
        outcome: "success",
        durationMs: Date.now() - started,
      });

      return {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        metrics: { durationMs: Date.now() - started },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      logger.error({ command, error: errorMessage }, "Command execution failed");

      recordToolMetric({
        tool: "bash",
        outcome: "fail",
        durationMs: Date.now() - started,
      });

      return {
        error: `Execution failed: ${errorMessage}`,
        exitCode: 1,
      };
    }
  },
});

/**
 * Create a bash tool with custom policy configuration
 */
export function createFlynnBashTool(policyPath?: string) {
  const policy = loadPolicy(policyPath);

  return anthropic.tools.bash_20241022({
    execute: async ({ command }: { command: string; restart?: boolean }): Promise<BashResult> => {
      const trimmedCommand = command.trim();
      const started = Date.now();
      const validation = validateCommand(trimmedCommand, policy);
      const cwdCheck = validatePath(process.cwd(), "write", policy);

      if (!validation.allowed || !cwdCheck.allowed) {
        return {
          error: `Blocked by policy: ${validation.reason || cwdCheck.reason}`,
          blockedCommand: trimmedCommand,
          metrics: { durationMs: Date.now() - started, blocked: true },
        };
      }

      try {
        const effectiveTimeout = Math.min(policy.agents.timeout_seconds * 1000, 120_000);
        const result = await executeShellSafe(trimmedCommand, {
          timeout: effectiveTimeout,
        });

        recordToolMetric({
          tool: "bash",
          outcome: "success",
          durationMs: Date.now() - started,
        });

        return {
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
          metrics: { durationMs: Date.now() - started },
        };
      } catch (error) {
        recordToolMetric({
          tool: "bash",
          outcome: "fail",
          durationMs: Date.now() - started,
        });
        return {
          error: `Execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          exitCode: 1,
        };
      }
    },
  });
}

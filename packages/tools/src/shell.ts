/**
 * Shell command execution tool
 */

import { type ExecSyncOptions, execSync } from "node:child_process";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Safe command patterns (from flynn.policy.yaml)
const ALLOWED_PATTERNS = [
  /^git\s/,
  /^pnpm\s/,
  /^npm\s/,
  /^uv\s/,
  /^node\s/,
  /^python\s/,
  /^ls\s/,
  /^cat\s/,
  /^grep\s/,
  /^find\s/,
  /^mkdir\s/,
  /^touch\s/,
  /^cp\s/,
  /^mv\s/,
  /^echo\s/,
  /^pwd$/,
  /^which\s/,
  /^whoami$/,
  /^date$/,
];

// Dangerous patterns to block
const BLOCKED_PATTERNS = [
  /rm\s+-rf\s+\//,
  /sudo\s/,
  /chmod\s+777/,
  />\s*\/dev\/sda/,
  /mkfs\s/,
  /dd\s+if=/,
  /:\(\)\s*{\s*:\|\s*:&\s*};\s*:/,
  /curl\s.*\|\s*bash/,
  /wget\s.*\|\s*bash/,
];

const inputSchema = z.object({
  command: z.string().describe("Shell command to execute"),
  cwd: z.string().optional().describe("Working directory"),
  timeout: z.number().default(30000).describe("Timeout in milliseconds"),
  allowUnsafe: z.boolean().default(false).describe("Allow commands not in safe list"),
});

const outputSchema = z.object({
  success: z.boolean(),
  command: z.string(),
  stdout: z.string(),
  stderr: z.string().optional(),
  error: z.string().optional(),
  blocked: z.boolean().optional(),
});

function isCommandAllowed(
  command: string,
  allowUnsafe: boolean,
): { allowed: boolean; reason?: string } {
  // Always block dangerous patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(command)) {
      return { allowed: false, reason: "Command matches blocked pattern" };
    }
  }

  // If unsafe is allowed, permit the command
  if (allowUnsafe) {
    return { allowed: true };
  }

  // Check against allowed patterns
  for (const pattern of ALLOWED_PATTERNS) {
    if (pattern.test(command)) {
      return { allowed: true };
    }
  }

  return { allowed: false, reason: "Command not in allowed list" };
}

type ShellInput = z.infer<typeof inputSchema>;

export const shellTool = createTool({
  id: "shell",
  description: "Execute shell commands safely",
  inputSchema,
  outputSchema,
  execute: async (inputData) => {
    const { command, cwd, timeout, allowUnsafe } = inputData as unknown as ShellInput;

    // Validate command
    const validation = isCommandAllowed(command, allowUnsafe);
    if (!validation.allowed) {
      return {
        success: false,
        command,
        stdout: "",
        error: validation.reason || "Command not allowed",
        blocked: true,
      };
    }

    const options: ExecSyncOptions = {
      encoding: "utf-8",
      timeout,
      maxBuffer: 10 * 1024 * 1024,
      cwd: cwd || process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
    };

    try {
      const stdout = execSync(command, options) as string;
      return {
        success: true,
        command,
        stdout: stdout.trim(),
      };
    } catch (error) {
      const execError = error as {
        stdout?: Buffer | string;
        stderr?: Buffer | string;
        message?: string;
      };
      return {
        success: false,
        command,
        stdout: String(execError.stdout || "").trim(),
        stderr: String(execError.stderr || "").trim(),
        error: execError.message || "Command execution failed",
      };
    }
  },
});

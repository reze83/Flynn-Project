/**
 * Shell command execution tool
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// PERFORMANCE: Use promisified exec for non-blocking execution
const execAsync = promisify(exec);

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

// Dangerous patterns to block (improved regex for better coverage)
const BLOCKED_PATTERNS = [
  /rm\s+(-[a-zA-Z]*)?r[a-zA-Z]*f[a-zA-Z]*\s+\//i, // rm -rf / with various flag combinations
  /rm\s+(-[a-zA-Z]*)?f[a-zA-Z]*r[a-zA-Z]*\s+\//i, // rm -fr / variant
  /(?:^|\s|\/usr\/bin\/)sudo(?:\s|$)/i, // sudo with full path support
  /chmod\s+(?:0?7{3}|[ugoa]*=[rwx]*,[ugoa]*=rwx)/i, // chmod 777, 0777, or symbolic
  />\s*\/dev\/(?:sda|sdb|nvme|hd|sd)/i, // Write to any block device
  /mkfs(?:\.[a-z0-9]+)?\s/i, // mkfs with any filesystem type
  /dd\s+.*(?:if|of)=/i, // dd with any input/output
  /:\s*\(\s*\)\s*{\s*:.*&\s*}\s*;\s*:/i, // Fork bomb variations
  /(?:curl|wget)\s+.*\|\s*(?:ba)?sh/i, // Pipe to any shell
  /eval\s*\(/i, // Prevent eval execution
  /\$\(.*\)/, // Command substitution in unsafe contexts
  /`.*`/, // Backtick command substitution
  />\s*\/etc\//i, // Write to /etc
  />\s*\/usr\//i, // Write to /usr
  />\s*\/bin\//i, // Write to /bin
  />\s*\/sbin\//i, // Write to /sbin
  /:\s*>\s*[^|]/, // Truncate files (: > file)
  /nc\s+-[el]/i, // Netcat listen mode (reverse shells)
  /python[23]?\s+-c/i, // Python one-liners (potential injection)
  /perl\s+-e/i, // Perl one-liners
  /ruby\s+-e/i, // Ruby one-liners
  /sh\s+-c/i, // Shell one-liners
];

const inputSchema = z.object({
  command: z.string().describe("Shell command to execute"),
  cwd: z.string().optional().describe("Working directory"),
  timeout: z.number().default(30000).describe("Timeout in milliseconds"),
  // SECURITY: allowUnsafe removed - all commands must pass validation
  // Previously: allowUnsafe: z.boolean().default(false)
});

const outputSchema = z.object({
  success: z.boolean(),
  command: z.string(),
  stdout: z.string(),
  stderr: z.string().optional(),
  error: z.string().optional(),
  blocked: z.boolean().optional(),
});

function isCommandAllowed(command: string): { allowed: boolean; reason?: string } {
  // SECURITY: Always block dangerous patterns first (no bypass)
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(command)) {
      return {
        allowed: false,
        reason: "Command blocked: matches security pattern",
      };
    }
  }

  // Check against allowed patterns (whitelist approach)
  for (const pattern of ALLOWED_PATTERNS) {
    if (pattern.test(command)) {
      return { allowed: true };
    }
  }

  return {
    allowed: false,
    reason: "Command not in allowed list. Use explicit allowed patterns.",
  };
}

type ShellInput = z.infer<typeof inputSchema>;

export const shellTool = createTool({
  id: "shell",
  description: "Execute shell commands safely",
  inputSchema,
  outputSchema,
  execute: async (inputData) => {
    // Mastra wraps input in context object
    const hasContext = inputData && typeof inputData === "object" && "context" in inputData;
    const input = (
      hasContext ? (inputData as { context: ShellInput }).context : inputData
    ) as ShellInput;
    const { command, cwd, timeout = 30000 } = input;

    // SECURITY: Validate command (no allowUnsafe bypass)
    const validation = isCommandAllowed(command);
    if (!validation.allowed) {
      return {
        success: false,
        command,
        stdout: "",
        error: validation.reason || "Command not allowed",
        blocked: true,
      };
    }

    // PERFORMANCE: Use async exec with AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: cwd || process.cwd(),
        maxBuffer: 10 * 1024 * 1024,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return {
        success: true,
        command,
        stdout: stdout.trim(),
        stderr: stderr ? stderr.trim() : undefined,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      const execError = error as {
        stdout?: string;
        stderr?: string;
        message?: string;
        killed?: boolean;
      };

      return {
        success: false,
        command,
        stdout: String(execError.stdout || "").trim(),
        stderr: String(execError.stderr || "").trim(),
        error: execError.killed
          ? "Command timed out"
          : execError.message || "Command execution failed",
      };
    }
  },
});

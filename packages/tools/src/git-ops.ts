/**
 * Git operations tool
 */

import { type ExecSyncOptions, execSync } from "node:child_process";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const execOptions: ExecSyncOptions = {
  encoding: "utf-8",
  timeout: 30000,
  maxBuffer: 10 * 1024 * 1024,
};

// Use simple object schema instead of discriminatedUnion for MCP compatibility
const inputSchema = z.object({
  operation: z.enum(["status", "log", "diff", "branch"]).describe("Git operation to perform"),
  path: z.string().default(".").describe("Repository path"),
  count: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .optional()
    .default(10)
    .describe("Number of commits to show (for log)"),
  staged: z.boolean().optional().default(false).describe("Show staged changes only (for diff)"),
});

const outputSchema = z.object({
  success: z.boolean(),
  operation: z.string(),
  output: z.string(),
  error: z.string().optional(),
});

type GitOpsInput = z.infer<typeof inputSchema>;

export const gitOpsTool = createTool({
  id: "git-ops",
  description: "Git operations (status, log, diff, branch)",
  inputSchema,
  outputSchema,
  execute: async (inputData) => {
    // Mastra wraps input in context object
    const hasContext = inputData && typeof inputData === "object" && "context" in inputData;
    const input = (
      hasContext ? (inputData as { context: GitOpsInput }).context : inputData
    ) as GitOpsInput;
    const { operation, path = ".", count = 10, staged = false } = input;

    try {
      let command: string;

      switch (operation) {
        case "status":
          command = "git status --porcelain";
          break;
        case "log": {
          // SECURITY: Validate count is a safe integer to prevent command injection
          const safeCount = Math.max(1, Math.min(1000, Math.floor(Number(count) || 10)));
          command = `git log --oneline -n ${safeCount}`;
          break;
        }
        case "diff":
          command = staged ? "git diff --cached" : "git diff";
          break;
        case "branch":
          command = "git branch -a";
          break;
        default:
          return {
            success: false,
            operation,
            output: "",
            error: `Unknown operation: ${operation}`,
          };
      }

      const output = execSync(command, {
        ...execOptions,
        cwd: path,
      }) as string;

      return {
        success: true,
        operation,
        output: output.trim(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        operation,
        output: "",
        error: message,
      };
    }
  },
});

/**
 * Git operations tool
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { execSync, type ExecSyncOptions } from "node:child_process";

const execOptions: ExecSyncOptions = {
  encoding: "utf-8",
  timeout: 30000,
  maxBuffer: 10 * 1024 * 1024,
};

const gitStatusSchema = z.object({
  operation: z.literal("status"),
  path: z.string().default(".").describe("Repository path"),
});

const gitLogSchema = z.object({
  operation: z.literal("log"),
  path: z.string().default(".").describe("Repository path"),
  count: z.number().default(10).describe("Number of commits to show"),
});

const gitDiffSchema = z.object({
  operation: z.literal("diff"),
  path: z.string().default(".").describe("Repository path"),
  staged: z.boolean().default(false).describe("Show staged changes only"),
});

const gitBranchSchema = z.object({
  operation: z.literal("branch"),
  path: z.string().default(".").describe("Repository path"),
});

const inputSchema = z.discriminatedUnion("operation", [
  gitStatusSchema,
  gitLogSchema,
  gitDiffSchema,
  gitBranchSchema,
]);

const outputSchema = z.object({
  success: z.boolean(),
  operation: z.string(),
  output: z.string(),
  error: z.string().optional(),
});

export const gitOpsTool = createTool({
  id: "git-ops",
  description: "Git operations (status, log, diff, branch)",
  inputSchema,
  outputSchema,
  execute: async (inputData) => {
    const { operation, path } = inputData;

    try {
      let command: string;

      switch (operation) {
        case "status":
          command = "git status --porcelain";
          break;
        case "log":
          const count = "count" in inputData ? inputData.count : 10;
          command = `git log --oneline -n ${count}`;
          break;
        case "diff":
          const staged = "staged" in inputData && inputData.staged;
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

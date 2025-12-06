/**
 * File operations tool
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const readSchema = z.object({
  operation: z.literal("read"),
  path: z.string().describe("File path to read"),
});

const writeSchema = z.object({
  operation: z.literal("write"),
  path: z.string().describe("File path to write"),
  content: z.string().describe("Content to write"),
  createDirs: z.boolean().default(true).describe("Create parent directories"),
});

const existsSchema = z.object({
  operation: z.literal("exists"),
  path: z.string().describe("Path to check"),
});

const listSchema = z.object({
  operation: z.literal("list"),
  path: z.string().describe("Directory path to list"),
  recursive: z.boolean().default(false).describe("List recursively"),
});

const inputSchema = z.discriminatedUnion("operation", [
  readSchema,
  writeSchema,
  existsSchema,
  listSchema,
]);

const outputSchema = z.object({
  success: z.boolean(),
  operation: z.string(),
  result: z.string().optional(),
  exists: z.boolean().optional(),
  files: z.array(z.string()).optional(),
  error: z.string().optional(),
});

type FileOpsInput = z.infer<typeof inputSchema>;
type FileOpsOutput = z.infer<typeof outputSchema>;

export const fileOpsTool = createTool({
  id: "file-ops",
  description: "File operations (read, write, exists, list)",
  inputSchema,
  outputSchema,
  execute: async (inputData): Promise<FileOpsOutput> => {
    // Compatibility: Mastra agent passes inputData directly, manual calls use { context } wrapper
    const hasContext = inputData && typeof inputData === "object" && "context" in inputData;
    const input = (
      hasContext ? (inputData as { context: FileOpsInput }).context : inputData
    ) as FileOpsInput;
    const { operation, path } = input;

    try {
      switch (operation) {
        case "read": {
          if (!existsSync(path)) {
            return {
              success: false,
              operation,
              error: `File not found: ${path}`,
            };
          }
          const content = readFileSync(path, "utf-8");
          return {
            success: true,
            operation,
            result: content,
          };
        }

        case "write": {
          const { content, createDirs } = input as z.infer<typeof writeSchema>;
          if (createDirs) {
            const dir = dirname(path);
            if (!existsSync(dir)) {
              mkdirSync(dir, { recursive: true });
            }
          }
          writeFileSync(path, content, "utf-8");
          return {
            success: true,
            operation,
            result: `Wrote ${content.length} bytes to ${path}`,
          };
        }

        case "exists": {
          return {
            success: true,
            operation,
            exists: existsSync(path),
          };
        }

        case "list": {
          if (!existsSync(path)) {
            return {
              success: false,
              operation,
              error: `Directory not found: ${path}`,
            };
          }

          const { recursive } = input as z.infer<typeof listSchema>;
          const files: string[] = [];

          // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: recursive dir listing
          function listDir(dir: string, prefix = "") {
            const entries = readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
              const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
              if (entry.isDirectory()) {
                files.push(`${fullPath}/`);
                if (recursive) {
                  listDir(`${dir}/${entry.name}`, fullPath);
                }
              } else {
                files.push(fullPath);
              }
            }
          }

          listDir(path);

          return {
            success: true,
            operation,
            files,
          };
        }

        default:
          return {
            success: false,
            operation,
            error: `Unknown operation: ${operation}`,
          };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        operation,
        error: message,
      };
    }
  },
});

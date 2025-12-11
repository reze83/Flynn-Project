/**
 * File operations tool
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Use simple object schema instead of discriminatedUnion for MCP compatibility
const inputSchema = z.object({
  operation: z.enum(["read", "write", "exists", "list"]).describe("File operation to perform"),
  path: z.string().describe("File or directory path"),
  content: z.string().optional().describe("Content to write (for write operation)"),
  createDirs: z
    .boolean()
    .optional()
    .default(true)
    .describe("Create parent directories (for write)"),
  recursive: z.boolean().optional().default(false).describe("List recursively (for list)"),
});

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
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: switch-based operation handler
  execute: async (inputData): Promise<FileOpsOutput> => {
    // Compatibility: Mastra agent passes inputData directly, manual calls use { context } wrapper
    const hasContext = inputData && typeof inputData === "object" && "context" in inputData;
    const input = (
      hasContext ? (inputData as { context: FileOpsInput }).context : inputData
    ) as FileOpsInput;
    const { operation, path, content, createDirs = true, recursive = false } = input;

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
          const fileContent = readFileSync(path, "utf-8");
          return {
            success: true,
            operation,
            result: fileContent,
          };
        }

        case "write": {
          if (content === undefined) {
            return {
              success: false,
              operation,
              error: "Content is required for write operation",
            };
          }
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

          const files: string[] = [];
          const MAX_DEPTH = 10; // SECURITY: Prevent infinite recursion

          // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: recursive directory listing
          function listDir(dir: string, prefix = "", depth = 0): void {
            if (depth > MAX_DEPTH) return; // Prevent runaway recursion

            const entries = readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
              const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
              if (entry.isDirectory()) {
                files.push(`${fullPath}/`);
                if (recursive) {
                  listDir(`${dir}/${entry.name}`, fullPath, depth + 1);
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

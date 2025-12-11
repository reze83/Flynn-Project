/**
 * File operations tool
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, normalize, resolve } from "node:path";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

/**
 * SECURITY: Validate path against traversal attacks
 * Returns normalized path if safe, throws if unsafe
 */
function validatePath(
  inputPath: string,
  baseDir?: string,
): { safe: boolean; normalizedPath: string; error?: string } {
  // Reject null bytes (path truncation attack)
  if (inputPath.includes("\0")) {
    return { safe: false, normalizedPath: "", error: "Path contains null bytes" };
  }

  // Get the effective base directory
  const effectiveBase = baseDir || process.cwd();

  // Normalize and resolve the path
  const normalizedPath = normalize(inputPath);
  const resolvedPath = isAbsolute(normalizedPath)
    ? normalizedPath
    : resolve(effectiveBase, normalizedPath);

  // Check for path traversal patterns
  if (normalizedPath.includes("..")) {
    // Verify the resolved path is still within allowed boundaries
    const resolvedBase = resolve(effectiveBase);
    if (!resolvedPath.startsWith(resolvedBase)) {
      return {
        safe: false,
        normalizedPath: "",
        error: `Path traversal detected: ${inputPath} resolves outside of allowed directory`,
      };
    }
  }

  // Block access to sensitive system paths
  const sensitivePaths = [
    "/etc/passwd",
    "/etc/shadow",
    "/etc/hosts",
    "/.ssh/",
    "/.gnupg/",
    "/.aws/",
    "/proc/",
    "/sys/",
    "/dev/",
  ];

  for (const sensitive of sensitivePaths) {
    if (resolvedPath.includes(sensitive)) {
      return {
        safe: false,
        normalizedPath: "",
        error: `Access to sensitive path blocked: ${sensitive}`,
      };
    }
  }

  return { safe: true, normalizedPath: resolvedPath };
}

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
      // SECURITY: Validate path before any operation
      const pathValidation = validatePath(path);
      if (!pathValidation.safe) {
        return {
          success: false,
          operation,
          error: pathValidation.error || "Invalid path",
        };
      }
      const safePath = pathValidation.normalizedPath;

      switch (operation) {
        case "read": {
          if (!existsSync(safePath)) {
            return {
              success: false,
              operation,
              error: `File not found: ${path}`,
            };
          }
          const fileContent = readFileSync(safePath, "utf-8");
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
            const dir = dirname(safePath);
            if (!existsSync(dir)) {
              mkdirSync(dir, { recursive: true });
            }
          }
          writeFileSync(safePath, content, "utf-8");
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
            exists: existsSync(safePath),
          };
        }

        case "list": {
          if (!existsSync(safePath)) {
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

          listDir(safePath);

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

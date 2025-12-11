/**
 * Performance Profiler Tool
 *
 * This Mastra tool allows Flynn to measure the execution time of a
 * function exported from a JavaScript/TypeScript module within the
 * repository. It dynamically imports the specified module and calls
 * the function with any provided arguments, returning the elapsed time
 * in milliseconds. Errors and exceptions are captured and returned
 * to the caller for inspection. The tool also writes an audit entry
 * each time it is invoked.
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { performance } from "node:perf_hooks";
import { logAudit } from "@flynn/core";

const inputSchema = z.object({
  modulePath: z.string().describe(
    "Relative or absolute path to the module to import. For example './packages/core/src/logger.js'."
  ),
  functionName: z.string().describe(
    "The name of the exported function to execute and time."
  ),
  args: z
    .array(z.any())
    .default([])
    .describe("Optional array of arguments to pass to the function"),
});

const outputSchema = z.object({
  durationMs: z.number().describe("Execution time of the function call in milliseconds"),
  result: z.any().optional().describe("Return value of the executed function, if any"),
  error: z.string().optional().describe("Error message if the function failed to run"),
});

export const performanceProfilerTool = createTool({
  id: "performance-profiler",
  description:
    "Measure execution time of a function exported by a local module. Useful for profiling Flynn internals.",
  inputSchema,
  outputSchema,
  execute: async (inputData) => {
    const data = (inputData as unknown) as {
      context?: { modulePath: string; functionName: string; args?: unknown[] };
      modulePath?: string;
      functionName?: string;
      args?: unknown[];
    };
    const modulePath = data?.context?.modulePath || data?.modulePath;
    const functionName = data?.context?.functionName || data?.functionName;
    const args = data?.context?.args || data?.args || [];
    if (!modulePath || !functionName) {
      return {
        durationMs: 0,
        error: `Both modulePath and functionName are required`,
      };
    }
    try {
      // Dynamically import the requested module. If modulePath is a relative
      // path, prepend file:// so that Node resolves it correctly. Absolute
      // paths beginning with '/' are interpreted directly by import().
      let resolvedPath = modulePath;
      if (modulePath.startsWith("./") || modulePath.startsWith("../")) {
        resolvedPath = new URL(modulePath, `file://${process.cwd()}/`).href;
      }
      const importedModule: Record<string, unknown> = await import(resolvedPath);
      const fn = importedModule[functionName];
      if (typeof fn !== "function") {
        return {
          durationMs: 0,
          error: `Function '${functionName}' not found in module '${modulePath}'`,
        };
      }
      const start = performance.now();
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await (fn as (...args: unknown[]) => unknown)(...args);
      const end = performance.now();
      const durationMs = end - start;
      // Record the profiling event in the audit log
      logAudit("performance-profiler", { modulePath, functionName, durationMs });
      return {
        durationMs,
        result,
      };
    } catch (err) {
      logAudit("performance-profiler-error", { modulePath, functionName, error: String(err) });
      return {
        durationMs: 0,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
});
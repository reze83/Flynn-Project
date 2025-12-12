/**
 * Codex Delegate Tool
 *
 * Main MCP tool for delegating tasks to OpenAI Codex CLI.
 * This file provides the tool definition and routes to operation handlers.
 */

import { createTool } from "@mastra/core/tools";

import { detectCodexPath, getDefaultPaths } from "./config.js";
import {
  handleConfigureOperation,
  handleDelegateOperation,
  handleResumeOperation,
  handleStatusOperation,
} from "./operations.js";
import {
  type CodexDelegateInput,
  type CodexDelegateOutput,
  codexDelegateInputSchema,
  codexDelegateOutputSchema,
} from "./types.js";

/**
 * Normalize input data from different formats
 */
function normalizeCodexDelegateInput(inputData: unknown): CodexDelegateInput {
  const hasContext = inputData && typeof inputData === "object" && "context" in inputData;
  return (
    hasContext ? (inputData as { context: CodexDelegateInput }).context : inputData
  ) as CodexDelegateInput;
}

export const codexDelegateTool = createTool({
  id: "codex-delegate",
  description:
    "Delegate tasks to OpenAI Codex CLI with proper context handoff. Supports delegation, session resume, status checks, and configuration.",
  inputSchema: codexDelegateInputSchema,
  outputSchema: codexDelegateOutputSchema,
  execute: async (inputData): Promise<CodexDelegateOutput> => {
    const input = normalizeCodexDelegateInput(inputData);

    const defaults = getDefaultPaths();
    const {
      operation,
      task,
      workingDir = process.cwd(),
      codexPath = detectCodexPath() || defaults.codexPath,
      configPath = defaults.configPath,
      outputDir = defaults.outputDir,
      sessionDir = defaults.sessionDir,
      handoffPath = defaults.handoffPath,
      sessionId,
      timeout = 600000,
      enableChunking = true,
      maxChunkDurationMs = 180000,
      context,
    } = input;

    try {
      if (operation === "configure") {
        return handleConfigureOperation(operation, configPath);
      }

      if (operation === "status") {
        return handleStatusOperation(operation, sessionId, sessionDir);
      }

      if (operation === "resume") {
        return await handleResumeOperation(
          operation,
          sessionId,
          sessionDir,
          outputDir,
          codexPath,
          workingDir,
          timeout,
        );
      }

      if (operation === "delegate") {
        return await handleDelegateOperation(
          operation,
          task,
          codexPath,
          handoffPath,
          workingDir,
          sessionDir,
          outputDir,
          timeout,
          enableChunking,
          maxChunkDurationMs,
          context,
        );
      }

      return {
        success: false,
        operation,
        error: `Unknown operation: ${operation}`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        operation,
        error: message,
        recoveryHint: "Use heal-error tool for recovery suggestions",
      };
    }
  },
});

/**
 * Heal Error Tool
 *
 * Analyzes errors and provides recovery strategies.
 * Used by the healer agent for automatic error recovery.
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Error categories and their recovery strategies
const ERROR_PATTERNS: Record<
  string,
  {
    pattern: RegExp;
    category: string;
    strategies: string[];
    retryable: boolean;
  }
> = {
  fileNotFound: {
    pattern: /ENOENT|no such file|file not found/i,
    category: "File System",
    strategies: [
      "Check if file path is correct",
      "Verify file exists before accessing",
      "Create file if it should exist",
      "Check directory permissions",
    ],
    retryable: true,
  },
  permissionDenied: {
    pattern: /EACCES|permission denied|access denied|unauthorized/i,
    category: "Permissions",
    strategies: [
      "Check file/directory permissions",
      "Run with appropriate privileges",
      "Verify ownership of resources",
      "Check if resource is locked",
    ],
    retryable: false,
  },
  networkError: {
    pattern: /ECONNREFUSED|ETIMEDOUT|network|connection|socket/i,
    category: "Network",
    strategies: [
      "Check network connectivity",
      "Verify service is running",
      "Check firewall settings",
      "Retry with exponential backoff",
    ],
    retryable: true,
  },
  moduleNotFound: {
    pattern: /cannot find module|module not found|import error|no module named/i,
    category: "Dependencies",
    strategies: [
      "Install missing dependency",
      "Check package.json/pyproject.toml",
      "Verify node_modules/.venv exists",
      "Run package manager install",
    ],
    retryable: true,
  },
  syntaxError: {
    pattern: /syntax error|unexpected token|parsing error|invalid syntax/i,
    category: "Code Syntax",
    strategies: [
      "Check for typos in code",
      "Verify brackets/parentheses match",
      "Check for missing semicolons/commas",
      "Validate JSON/YAML syntax",
    ],
    retryable: false,
  },
  typeError: {
    pattern: /type error|is not a function|undefined is not|null is not/i,
    category: "Type Error",
    strategies: [
      "Check variable types",
      "Add null/undefined checks",
      "Verify function exists before calling",
      "Check API response structure",
    ],
    retryable: false,
  },
  outOfMemory: {
    pattern: /out of memory|heap|memory limit|ENOMEM/i,
    category: "Resources",
    strategies: [
      "Process data in smaller chunks",
      "Increase memory limit",
      "Clear unused variables",
      "Use streaming instead of loading all data",
    ],
    retryable: false,
  },
  timeout: {
    pattern: /timeout|timed out|deadline exceeded/i,
    category: "Timeout",
    strategies: [
      "Increase timeout duration",
      "Check if service is overloaded",
      "Optimize slow operations",
      "Retry with longer timeout",
    ],
    retryable: true,
  },
  gitError: {
    pattern: /git|merge conflict|cannot rebase|detached head/i,
    category: "Git",
    strategies: [
      "Check git status",
      "Resolve merge conflicts",
      "Stash or commit changes first",
      "Reset to known good state",
    ],
    retryable: true,
  },
  buildError: {
    pattern: /build failed|compilation error|tsc|webpack|vite/i,
    category: "Build",
    strategies: [
      "Check TypeScript errors",
      "Verify imports are correct",
      "Clean build cache and retry",
      "Check build configuration",
    ],
    retryable: true,
  },
};

const inputSchema = z.object({
  error: z.string().describe("The error message or stack trace"),
  context: z.string().optional().describe("Additional context about what was being attempted"),
  previousAction: z.string().optional().describe("The action that caused the error"),
  retryCount: z.number().optional().default(0).describe("Number of previous retry attempts"),
});

const outputSchema = z.object({
  category: z.string(),
  diagnosis: z.string(),
  strategies: z.array(z.string()),
  suggestedAction: z.string(),
  shouldRetry: z.boolean(),
  maxRetries: z.number(),
  remainingRetries: z.number(),
  healerInstructions: z.string(),
  escalate: z.boolean(),
});

export const healErrorTool = createTool({
  id: "heal-error",
  description:
    "Analyze an error and provide recovery strategies. Returns diagnosis, suggested actions, and retry guidance.",
  inputSchema,
  outputSchema,
  execute: async (input) => {
    const data = input as {
      context?: { error?: string; context?: string; previousAction?: string; retryCount?: number };
      error?: string;
      context2?: string;
      previousAction?: string;
      retryCount?: number;
    };

    const error = data?.context?.error || data?.error || "";
    const additionalContext = data?.context?.context || data?.context2 || "";
    const previousAction = data?.context?.previousAction || data?.previousAction || "";
    const retryCount = data?.context?.retryCount ?? data?.retryCount ?? 0;

    const maxRetries = 3;
    const remainingRetries = Math.max(0, maxRetries - retryCount);

    // Find matching error pattern
    let matchedPattern: (typeof ERROR_PATTERNS)[string] | null = null;

    for (const [, pattern] of Object.entries(ERROR_PATTERNS)) {
      if (pattern.pattern.test(error)) {
        matchedPattern = pattern;
        break;
      }
    }

    // Default for unknown errors
    if (!matchedPattern) {
      matchedPattern = {
        pattern: /./,
        category: "Unknown",
        strategies: [
          "Analyze the error message carefully",
          "Check logs for more context",
          "Search for similar issues",
          "Escalate to user if unclear",
        ],
        retryable: false,
      };
    }

    // Generate diagnosis
    const diagnosis = generateDiagnosis(error, matchedPattern.category, additionalContext);

    // Determine if we should retry
    const shouldRetry = matchedPattern.retryable && remainingRetries > 0;

    // Get healer instructions
    const healerInstructions = generateHealerInstructions(
      matchedPattern,
      previousAction,
      shouldRetry,
      remainingRetries,
    );

    // Determine if we should escalate
    const escalate = !shouldRetry && remainingRetries === 0;

    return {
      category: matchedPattern.category,
      diagnosis,
      strategies: matchedPattern.strategies,
      suggestedAction: matchedPattern.strategies[0] || "Investigate the error",
      shouldRetry,
      maxRetries,
      remainingRetries,
      healerInstructions,
      escalate,
    };
  },
});

function generateDiagnosis(error: string, category: string, context: string): string {
  const parts = [`Error Category: ${category}`];

  if (context) {
    parts.push(`Context: ${context}`);
  }

  // Extract key information from error
  const lines = error.split("\n").slice(0, 3);
  if (lines.length > 0) {
    parts.push(`Error: ${lines[0]}`);
  }

  return parts.join("\n");
}

function generateHealerInstructions(
  pattern: (typeof ERROR_PATTERNS)[string],
  previousAction: string,
  shouldRetry: boolean,
  remainingRetries: number,
): string {
  const instructions: string[] = [];

  instructions.push(`## Recovery for ${pattern.category} Error`);
  instructions.push("");

  if (previousAction) {
    instructions.push(`Failed action: ${previousAction}`);
    instructions.push("");
  }

  instructions.push("### Recommended Steps:");
  pattern.strategies.forEach((strategy, idx) => {
    instructions.push(`${idx + 1}. ${strategy}`);
  });

  instructions.push("");

  if (shouldRetry) {
    instructions.push("### Retry Status");
    instructions.push("- This error is retryable");
    instructions.push(`- Remaining attempts: ${remainingRetries}`);
    instructions.push("- Apply fix before retrying");
  } else if (remainingRetries === 0) {
    instructions.push("### Escalation Required");
    instructions.push("- Maximum retries exceeded");
    instructions.push("- Present options to user");
    instructions.push("- Explain what was tried");
  } else {
    instructions.push("### Manual Resolution Required");
    instructions.push("- This error type requires manual intervention");
    instructions.push("- Follow strategies above");
    instructions.push("- Inform user of the issue");
  }

  return instructions.join("\n");
}

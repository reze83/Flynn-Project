/**
 * Anthropic Text Editor Wrapper with Flynn Policy Enforcement
 * Validates file paths against flynn.policy.yaml before access
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, normalize, resolve } from "node:path";
import { anthropic } from "@ai-sdk/anthropic";
import { loadPolicy, validatePath } from "@flynn/core";

interface EditorResult {
  content?: string;
  success?: boolean;
  message?: string;
  error?: string;
  reason?: string;
  metrics?: {
    durationMs: number;
    blocked?: boolean;
  };
}

/**
 * Read a file safely with error handling
 */
function readFileSafe(filePath: string): string {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return readFileSync(filePath, "utf8");
}

/**
 * Write a file safely, ensuring directories exist
 */
function writeFileSafe(filePath: string, content: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(filePath, content, "utf8");
}

export interface EditorInput {
  command: string;
  path: string;
  old_str?: string;
  new_str?: string;
  insert_line?: number;
}

type EditorCommandHandler = (context: {
  normalizedPath: string;
  old_str?: string;
  new_str?: string;
  insert_line?: number;
}) => EditorResult;

const handleView: EditorCommandHandler = ({ normalizedPath }) => ({
  content: readFileSafe(normalizedPath),
});

const handleCreate: EditorCommandHandler = ({ normalizedPath, new_str }) => {
  writeFileSafe(normalizedPath, new_str || "");
  return { success: true, message: `Created ${normalizedPath}` };
};

const handleStrReplace: EditorCommandHandler = ({ normalizedPath, old_str, new_str }) => {
  if (!old_str) {
    return { error: "old_str required" };
  }
  const content = readFileSafe(normalizedPath);
  if (!content.includes(old_str)) {
    return { error: "String not found" };
  }
  writeFileSafe(normalizedPath, content.replace(old_str, new_str || ""));
  return { success: true, message: `Updated ${normalizedPath}` };
};

const handleInsert: EditorCommandHandler = ({ normalizedPath, new_str, insert_line }) => {
  if (insert_line === undefined) {
    return { error: "insert_line required" };
  }
  const lines = readFileSafe(normalizedPath).split("\n");
  lines.splice(insert_line, 0, new_str || "");
  writeFileSafe(normalizedPath, lines.join("\n"));
  return { success: true, message: `Inserted at line ${insert_line}` };
};

function getCommandHandler(command: string): EditorCommandHandler | undefined {
  switch (command) {
    case "view":
      return handleView;
    case "create":
      return handleCreate;
    case "str_replace":
      return handleStrReplace;
    case "insert":
      return handleInsert;
    default:
      return undefined;
  }
}

/**
 * SECURITY: Validate path is within allowed base directory (prevent path traversal)
 */
function isPathWithinBase(filePath: string, baseDir: string): boolean {
  const normalizedPath = normalize(resolve(filePath));
  const normalizedBase = normalize(resolve(baseDir));
  return normalizedPath.startsWith(normalizedBase);
}

/**
 * Safely validate a path against policy with path traversal protection
 * SECURITY: Fails closed (denies) if policy cannot be loaded
 */
function safeValidatePath(
  filePath: string,
  operation: "read" | "write",
): { allowed: boolean; reason?: string } {
  // SECURITY: Get base directory from PROJECT_ROOT or cwd
  const baseDir = process.env.PROJECT_ROOT || process.cwd();

  // SECURITY: Check for path traversal attacks
  if (!isPathWithinBase(filePath, baseDir)) {
    return {
      allowed: false,
      reason: `Path traversal blocked: ${filePath} is outside project root`,
    };
  }

  // SECURITY: Block access to sensitive directories
  const sensitivePatterns = [
    /[\\/]\.ssh[\\/]/i,
    /[\\/]\.gnupg[\\/]/i,
    /[\\/]\.aws[\\/]/i,
    /[\\/]\.config[\\/](?!claude)/i, // Allow .config/claude but block others
    /[\\/]\.env(?:\.[^/\\]*)?$/i, // Block .env files
    /[\\/]\.git[\\/]config$/i, // Block git config
    /[\\/]credentials/i,
    /[\\/]secrets?[\\/]/i,
    /[\\/]private[\\/]/i,
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(filePath)) {
      return {
        allowed: false,
        reason: `Access to sensitive path blocked: ${filePath}`,
      };
    }
  }

  try {
    const policy = loadPolicy();
    return validatePath(filePath, operation, policy);
  } catch {
    // SECURITY: Fail closed - deny if policy cannot be loaded
    return {
      allowed: false,
      reason: "Policy not loaded - access denied by default",
    };
  }
}

async function executeEditorCommand({
  command,
  path: pathInput,
  old_str,
  new_str,
  insert_line,
}: EditorInput): Promise<EditorResult> {
  const accessType = command === "view" ? "read" : "write";
  const normalizedPath = resolve(pathInput);
  const validation = safeValidatePath(normalizedPath, accessType);

  if (!validation.allowed) {
    return {
      error: `Path blocked by policy: ${normalizedPath}`,
      reason: validation.reason,
    };
  }

  const handler = getCommandHandler(command);
  if (!handler) {
    return { error: `Unknown command: ${command}` };
  }

  try {
    return handler({ normalizedPath, old_str, new_str, insert_line });
  } catch (error) {
    return {
      error: `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export const flynnTextEditorTools = {
  str_replace_based_edit_tool: anthropic.tools.textEditor_20250124({
    execute: executeEditorCommand,
  }),
};

/**
 * Create editor tools with custom policy configuration
 */
export function createFlynnTextEditorTools(policyPath?: string) {
  const policy = loadPolicy(policyPath);

  const customExecuteEditorCommand = async ({
    command,
    path: pathInput,
    old_str,
    new_str,
    insert_line,
  }: EditorInput): Promise<EditorResult> => {
    const accessType = command === "view" ? "read" : "write";
    const normalizedPath = resolve(pathInput);
    const validation = validatePath(normalizedPath, accessType, policy);

    if (!validation.allowed) {
      return {
        error: `Path blocked by policy: ${normalizedPath}`,
        reason: validation.reason,
      };
    }

    const handler = getCommandHandler(command);
    if (!handler) {
      return { error: `Unknown command: ${command}` };
    }

    try {
      return handler({ normalizedPath, old_str, new_str, insert_line });
    } catch (error) {
      return {
        error: `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  };

  return {
    str_replace_based_edit_tool: anthropic.tools.textEditor_20250124({
      execute: customExecuteEditorCommand,
    }),
  };
}

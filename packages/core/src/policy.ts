/**
 * Flynn Policy Module
 * Loads and validates operations against flynn.policy.yaml
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { minimatch } from "minimatch";
import { parse as parseYaml } from "yaml";
import { createLogger } from "./logger.js";

const logger = createLogger("policy");

// Policy schema types
export interface PolicyConfig {
  version: string;
  permissions: {
    shell: {
      allow: string[];
      deny: string[];
    };
    paths: {
      whitelist?: string[];
      writable: string[];
      readonly: string[];
    };
    network: {
      allow: string[];
      deny: string[];
    };
  };
  agents: {
    max_iterations: number;
    timeout_seconds: number;
    max_retries: number;
  };
  logging: {
    level: string;
    format: string;
    include_timestamps: boolean;
  };
}

// Cached policy
let cachedPolicy: PolicyConfig | null = null;

function findProjectRoot(baseDir: string): string | null {
  let current = baseDir;

  while (true) {
    const hasWorkspace = existsSync(join(current, "pnpm-workspace.yaml"));
    const hasPackageJson = existsSync(join(current, "package.json"));
    const hasGit = existsSync(join(current, ".git"));

    if (hasWorkspace || hasPackageJson || hasGit) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

function ensureProjectRoot(baseDir: string): string {
  const envRoot = process.env.PROJECT_ROOT?.trim();
  if (envRoot) return envRoot;

  const inferred = findProjectRoot(baseDir);
  if (inferred) return inferred;

  throw new Error("PROJECT_ROOT is not set and project root could not be inferred");
}

/**
 * Resolve environment variables in a path pattern
 */
function resolveEnvVars(pattern: string, projectRoot: string): string {
  return pattern.replace(/\$\{(\w+)\}/g, (_, envVar) => {
    if (envVar === "PROJECT_ROOT") {
      return process.env.PROJECT_ROOT || projectRoot;
    }

    return process.env[envVar] || "";
  });
}

/**
 * Convert shell glob pattern to regex
 */
function shellPatternToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp(`^${escaped}$`);
}

/**
 * Load policy from config file
 */
export function loadPolicy(configPath?: string): PolicyConfig {
  if (cachedPolicy && !configPath) {
    return cachedPolicy;
  }

  const profile = process.env.FLYNN_POLICY_PROFILE?.trim();
  const policyPath =
    configPath ||
    (profile
      ? join(process.cwd(), "config", `flynn.policy.${profile}.yaml`)
      : join(process.cwd(), "config", "flynn.policy.yaml"));

  const baseDir = dirname(policyPath);
  ensureProjectRoot(baseDir);

  if (!existsSync(policyPath)) {
    logger.warn({ path: policyPath }, "Policy file not found, using defaults");
    return getDefaultPolicy();
  }

  try {
    const content = readFileSync(policyPath, "utf-8");
    const policy = parseYaml(content) as PolicyConfig;

    if (!configPath) {
      cachedPolicy = policy;
    }

    logger.debug({ path: policyPath }, "Policy loaded");
    return policy;
  } catch (error) {
    logger.error({ error, path: policyPath }, "Failed to load policy");
    return getDefaultPolicy();
  }
}

/**
 * Get default restrictive policy
 */
function getDefaultPolicy(): PolicyConfig {
  // Allow callers to extend deny patterns via the FLYNN_POLICY_CUSTOM_DENY env var.
  // This variable accepts a comma-separated list of patterns that will be
  // appended to the default deny list at runtime. See README for examples.
  const customDenyEnv = process.env.FLYNN_POLICY_CUSTOM_DENY || "";
  const customDenyPatterns = customDenyEnv
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  // Define the base deny patterns for shell commands. These patterns block
  // destructive filesystem operations, privilege escalation and risky network
  // downloads. They reflect recommendations from Node.js security best
  // practices to avoid using dangerous functions and modules like eval and
  // child_process【430188905619224†L703-L713】.
  const baseDenyPatterns = [
    "rm -rf /",
    "rm -rf *",
    "sudo *",
    "mkfs.*",
    ".*dd if=.* of=/dev/.*",
    "chmod 7[0-7][0-7] /etc/*",
    "poweroff",
    "reboot",
    "shutdown",
    "kill -9 *",
    "curl http*",
    "wget http*",
    // Deny spawning arbitrary shells via node -e or child_process
    "node -e *",
    "node -p *",
    "node --eval=*",
  ];
  const denyPatterns = [...baseDenyPatterns, ...customDenyPatterns];
  return {
    version: "1.0",
    permissions: {
      shell: {
        allow: ["git *", "pnpm *", "npm *", "node *"],
        deny: denyPatterns,
      },
      paths: {
        writable: ["${PROJECT_ROOT}/**"],
        readonly: ["/etc", "/usr", "/bin"],
      },
      network: {
        allow: ["api.anthropic.com", "api.openai.com"],
        deny: ["*"],
      },
    },
    agents: {
      max_iterations: 10,
      timeout_seconds: 300,
      max_retries: 3,
    },
    logging: {
      level: "info",
      format: "json",
      include_timestamps: true,
    },
  };
}

/**
 * Validate a shell command against policy
 */
export function validateCommand(
  command: string,
  policy?: PolicyConfig,
): { allowed: boolean; reason?: string } {
  const p = policy || loadPolicy();

  // Check deny patterns first (higher priority)
  for (const pattern of p.permissions.shell.deny) {
    const regex = shellPatternToRegex(pattern);
    if (regex.test(command)) {
      return {
        allowed: false,
        reason: `Command matches deny pattern: ${pattern}`,
      };
    }
  }

  // Check allow patterns
  for (const pattern of p.permissions.shell.allow) {
    const regex = shellPatternToRegex(pattern);
    if (regex.test(command)) {
      return { allowed: true };
    }
  }

  return {
    allowed: false,
    reason: "Command not in allowed list",
  };
}

interface ResolvedPaths {
  whitelist: string[];
  writable: string[];
  readonly: string[];
}

/**
 * Resolve environment variables in all path patterns
 */
function resolveAllPaths(policy: PolicyConfig, projectRoot: string): ResolvedPaths {
  return {
    whitelist: (policy.permissions.paths.whitelist || []).map((p) =>
      resolveEnvVars(p, projectRoot),
    ),
    writable: policy.permissions.paths.writable.map((p) => resolveEnvVars(p, projectRoot)),
    readonly: policy.permissions.paths.readonly.map((p) => resolveEnvVars(p, projectRoot)),
  };
}

/**
 * Check if path matches any pattern in the list
 */
function pathMatchesAny(filePath: string, patterns: string[]): boolean {
  return patterns.some((pattern) => minimatch(filePath, pattern));
}

/**
 * Validate write operation against path policy
 */
function validateWriteOperation(
  filePath: string,
  paths: ResolvedPaths,
): { allowed: boolean; reason?: string } {
  if (pathMatchesAny(filePath, paths.writable)) {
    return { allowed: true };
  }
  if (pathMatchesAny(filePath, paths.readonly)) {
    return { allowed: false, reason: `Path is read-only: ${filePath}` };
  }
  return { allowed: false, reason: `Path not in writable list: ${filePath}` };
}

/**
 * Validate read operation against path policy
 */
function validateReadOperation(
  filePath: string,
  paths: ResolvedPaths,
): { allowed: boolean; reason?: string } {
  const allAccessible = [...paths.writable, ...paths.readonly];
  if (pathMatchesAny(filePath, allAccessible)) {
    return { allowed: true };
  }
  return { allowed: false, reason: `Path not accessible: ${filePath}` };
}

/**
 * Validate a file path against policy
 */
export function validatePath(
  filePath: string,
  operation: "read" | "write",
  policy?: PolicyConfig,
): { allowed: boolean; reason?: string } {
  const p = policy || loadPolicy();
  const projectRoot = ensureProjectRoot(process.cwd());
  const paths = resolveAllPaths(p, projectRoot);

  // If whitelist exists, enforce it for all operations
  if (paths.whitelist.length > 0 && !pathMatchesAny(filePath, paths.whitelist)) {
    return { allowed: false, reason: `Path not in whitelist: ${filePath}` };
  }

  return operation === "write"
    ? validateWriteOperation(filePath, paths)
    : validateReadOperation(filePath, paths);
}

/**
 * Validate a network host against policy
 */
export function validateNetwork(
  host: string,
  policy?: PolicyConfig,
): { allowed: boolean; reason?: string } {
  const p = policy || loadPolicy();

  // Check deny patterns first
  for (const pattern of p.permissions.network.deny) {
    if (pattern === "*") continue; // Handle wildcard deny last
    const regex = shellPatternToRegex(pattern);
    if (regex.test(host)) {
      return {
        allowed: false,
        reason: `Host matches deny pattern: ${pattern}`,
      };
    }
  }

  // Check allow patterns
  for (const pattern of p.permissions.network.allow) {
    const regex = shellPatternToRegex(pattern);
    if (regex.test(host)) {
      return { allowed: true };
    }
  }

  // Check for wildcard deny
  if (p.permissions.network.deny.includes("*")) {
    return {
      allowed: false,
      reason: "Host not in allowed list (default deny)",
    };
  }

  return { allowed: true };
}

/**
 * Validate the use of potentially dangerous Node.js functions within a code
 * snippet. This helper scans a string of source code for the presence of
 * functions that are known to introduce security risks (e.g. `eval`,
 * `child_process.exec`, `vm.runInNewContext`). Use this check to avoid
 * evaluating untrusted input at runtime. If a dangerous function is found,
 * the function returns `allowed: false` with an appropriate reason. Otherwise,
 * it returns `allowed: true`.
 *
 * Note: This function performs a simple substring search and does not
 * implement a full parser; false positives may occur if the keywords appear
 * within strings or comments. Use a proper static analysis tool for
 * production code review【430188905619224†L703-L713】.
 */
export function validateFunctionUsage(code: string): { allowed: boolean; reason?: string } {
  const dangerous = [
    "eval(",
    "child_process.exec(",
    "child_process.execSync(",
    "require('child_process').exec(",
    'require("child_process").exec(',
    "vm.runInNewContext(",
    "vm.runInContext(",
    "setTimeout(",
    "setInterval(",
    "setImmediate(",
  ];
  for (const keyword of dangerous) {
    if (code.includes(keyword)) {
      return {
        allowed: false,
        reason: `Use of dangerous function detected: ${keyword.replace(/\(/, "")}`,
      };
    }
  }
  return { allowed: true };
}

// ============================================================================
// AST Security Validation Helper Functions
// Pattern: Extract Method (Refactoring.Guru)
// Purpose: Reduce cognitive complexity of visit function from 30 to ~10
// ============================================================================

/**
 * Result of a dangerous pattern check
 */
interface DangerousPatternResult {
  found: boolean;
  functionName?: string;
}

/**
 * Check if expression is an eval pattern
 */
function isEvalPattern(exprText: string): boolean {
  return (
    exprText === "eval" ||
    exprText.includes("eval.call") ||
    exprText.includes("eval.apply") ||
    exprText.includes("window.eval") ||
    exprText.includes("globalThis.eval") ||
    /^\(.*eval.*\)$/.test(exprText)
  );
}

/**
 * Check if expression is a child_process pattern
 */
function isChildProcessPattern(exprText: string): boolean {
  return (
    exprText.includes("child_process.exec") ||
    exprText.includes("child_process.spawn") ||
    exprText.includes("child_process.fork") ||
    exprText.includes("cp.exec") ||
    exprText.includes("cp.spawn")
  );
}

/**
 * Check if expression is a vm module pattern
 */
function isVmModulePattern(exprText: string): boolean {
  return (
    exprText.includes("vm.runInNewContext") ||
    exprText.includes("vm.runInContext") ||
    exprText.includes("vm.runInThisContext")
  );
}

/**
 * Check call expression for dangerous patterns
 */
function checkCallExpressionForDanger(
  ts: typeof import("typescript"),
  node: import("typescript").CallExpression,
  sourceFile: import("typescript").SourceFile,
): DangerousPatternResult {
  const exprText = node.expression.getText(sourceFile);

  if (isEvalPattern(exprText)) {
    return { found: true, functionName: `eval (${exprText})` };
  }

  if (isChildProcessPattern(exprText)) {
    return { found: true, functionName: `child_process (${exprText})` };
  }

  if (isVmModulePattern(exprText)) {
    return { found: true, functionName: `vm module (${exprText})` };
  }

  // Check setTimeout/setInterval with string argument
  if ((exprText === "setTimeout" || exprText === "setInterval") && node.arguments.length > 0) {
    const firstArg = node.arguments[0];
    if (firstArg && (ts.isStringLiteral(firstArg) || ts.isTemplateLiteral(firstArg))) {
      return { found: true, functionName: `${exprText} with string argument` };
    }
  }

  return { found: false };
}

/**
 * Check new expression for dangerous patterns
 */
function checkNewExpressionForDanger(
  node: import("typescript").NewExpression,
  sourceFile: import("typescript").SourceFile,
): DangerousPatternResult {
  const exprText = node.expression.getText(sourceFile);
  if (exprText === "Function") {
    return { found: true, functionName: "Function constructor" };
  }
  return { found: false };
}

/**
 * AST-based validation of dangerous function usage.
 * This is more robust than substring matching as it properly parses the code structure.
 *
 * Detects:
 * - Direct eval() calls
 * - Indirect eval: eval.call(), window.eval(), (1, eval)()
 * - child_process methods: exec, execSync, spawn, fork
 * - vm module: runInNewContext, runInContext, runInThisContext
 * - Dynamic code execution: Function constructor, setTimeout/setInterval with strings
 *
 * Based on TypeScript AST analysis best practices.
 * Source: https://krython.com/tutorial/typescript/code-security-review-static-analysis
 *
 * REFACTORED: Complexity reduced from 30 to ~10 using Extract Method pattern
 * Source: https://refactoring.guru/extract-method
 */
export function validateFunctionUsageAST(code: string): { allowed: boolean; reason?: string } {
  // Import TypeScript compiler API dynamically to avoid build issues
  let ts: typeof import("typescript");
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ts = require("typescript");
  } catch {
    // Fallback to legacy substring matching if TypeScript is not available
    return validateFunctionUsage(code);
  }

  try {
    const sourceFile = ts.createSourceFile("temp.ts", code, ts.ScriptTarget.Latest, true);

    let dangerousFunction: string | null = null;
    let dangerousLine = 0;

    const visit = (node: import("typescript").Node): void => {
      // Check call expressions using extracted helper
      if (ts.isCallExpression(node)) {
        const result = checkCallExpressionForDanger(ts, node, sourceFile);
        if (result.found && result.functionName) {
          dangerousFunction = result.functionName;
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          dangerousLine = line + 1;
        }
      }

      // Check new expressions using extracted helper
      if (ts.isNewExpression(node)) {
        const result = checkNewExpressionForDanger(node, sourceFile);
        if (result.found && result.functionName) {
          dangerousFunction = result.functionName;
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          dangerousLine = line + 1;
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    if (dangerousFunction) {
      return {
        allowed: false,
        reason: `Use of dangerous function detected: ${dangerousFunction} at line ${dangerousLine}`,
      };
    }

    return { allowed: true };
  } catch (error) {
    // If AST parsing fails, the code might be malicious or malformed
    return {
      allowed: false,
      reason: `Code parsing failed - potentially malicious or invalid syntax: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Get agent configuration from policy
 */
export function getAgentConfig(policy?: PolicyConfig): PolicyConfig["agents"] {
  const p = policy || loadPolicy();
  return p.agents;
}

/**
 * Clear cached policy (for testing or config reload)
 */
export function clearPolicyCache(): void {
  cachedPolicy = null;
}

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

/**
 * Validate a file path against policy
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: validation logic with multiple checks
export function validatePath(
  filePath: string,
  operation: "read" | "write",
  policy?: PolicyConfig,
): { allowed: boolean; reason?: string } {
  const p = policy || loadPolicy();
  const projectRoot = ensureProjectRoot(process.cwd());

  // Resolve environment variables in patterns
  const whitelistPaths = (p.permissions.paths.whitelist || []).map((pattern) =>
    resolveEnvVars(pattern, projectRoot),
  );
  const writablePaths = p.permissions.paths.writable.map((pattern) =>
    resolveEnvVars(pattern, projectRoot),
  );
  const readonlyPaths = p.permissions.paths.readonly.map((pattern) =>
    resolveEnvVars(pattern, projectRoot),
  );

  // If whitelist exists, enforce it for all operations
  if (whitelistPaths.length > 0) {
    const inWhitelist = whitelistPaths.some((pattern) => minimatch(filePath, pattern));
    if (!inWhitelist) {
      return { allowed: false, reason: `Path not in whitelist: ${filePath}` };
    }
  }

  if (operation === "write") {
    // Check if path matches any writable pattern
    for (const pattern of writablePaths) {
      if (minimatch(filePath, pattern)) {
        return { allowed: true };
      }
    }

    // Check if path matches readonly (not writable)
    for (const pattern of readonlyPaths) {
      if (minimatch(filePath, pattern)) {
        return {
          allowed: false,
          reason: `Path is read-only: ${filePath}`,
        };
      }
    }

    return {
      allowed: false,
      reason: `Path not in writable list: ${filePath}`,
    };
  }

  // Read operation - allowed in both writable and readonly paths
  for (const pattern of [...writablePaths, ...readonlyPaths]) {
    if (minimatch(filePath, pattern)) {
      return { allowed: true };
    }
  }

  return {
    allowed: false,
    reason: `Path not accessible: ${filePath}`,
  };
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
    "require(\"child_process\").exec(",
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
        reason: `Use of dangerous function detected: ${keyword.replace(/\\(/, '')}`,
      };
    }
  }
  return { allowed: true };
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

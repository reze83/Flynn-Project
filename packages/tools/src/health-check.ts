/**
 * Health Check Tool
 *
 * Performs system health checks:
 * - Environment validation (Node, pnpm, Python)
 * - MCP server status
 * - Dependencies check
 * - Configuration audit
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import { join } from "node:path";
import { createLogger } from "@flynn/core";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const logger = createLogger("health-check");

/**
 * SECURITY: Safe JSON parse that prevents prototype pollution
 */
function safeJsonParse<T>(content: string): T {
  return JSON.parse(content, (key, value) => {
    // Block prototype pollution attempts
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      return undefined;
    }
    return value;
  }) as T;
}

const inputSchema = z.object({
  checks: z
    .array(z.enum(["environment", "dependencies", "configuration", "mcp", "all"]))
    .optional()
    .default(["all"])
    .describe("Which checks to run"),
  projectPath: z.string().optional().describe("Project path to check (defaults to cwd)"),
});

const outputSchema = z.object({
  healthy: z.boolean(),
  timestamp: z.string(),
  summary: z.object({
    passed: z.number(),
    failed: z.number(),
    warnings: z.number(),
  }),
  checks: z.array(
    z.object({
      name: z.string(),
      status: z.enum(["pass", "fail", "warn"]),
      message: z.string(),
      details: z.record(z.string(), z.any()).optional(),
    }),
  ),
  recommendations: z.array(z.string()),
});

interface CheckResult {
  name: string;
  status: "pass" | "fail" | "warn";
  message: string;
  details?: Record<string, unknown>;
}

function runCommand(command: string): { success: boolean; output: string } {
  try {
    const output = execSync(command, {
      encoding: "utf-8",
      timeout: 10000,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    return { success: true, output };
  } catch (error) {
    // Log command failures for debugging visibility
    logger.debug(
      { command, error: error instanceof Error ? error.message : String(error) },
      "Command failed",
    );
    return { success: false, output: "" };
  }
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: aggregates multiple environment checks in one routine
function checkEnvironment(): CheckResult[] {
  const results: CheckResult[] = [];

  // Node.js
  const nodeResult = runCommand("node --version");
  if (nodeResult.success) {
    const version = nodeResult.output.replace("v", "");
    const majorVersion = Number.parseInt(version.split(".")[0] || "0");
    if (majorVersion >= 20) {
      results.push({
        name: "Node.js",
        status: "pass",
        message: `Node.js ${version} installed`,
        details: { version, required: ">=20.0.0" },
      });
    } else {
      results.push({
        name: "Node.js",
        status: "fail",
        message: `Node.js ${version} is below required 20.0.0`,
        details: { version, required: ">=20.0.0" },
      });
    }
  } else {
    results.push({
      name: "Node.js",
      status: "fail",
      message: "Node.js not found",
    });
  }

  // pnpm
  const pnpmResult = runCommand("pnpm --version");
  if (pnpmResult.success) {
    const version = pnpmResult.output;
    const majorVersion = Number.parseInt(version.split(".")[0] || "0");
    if (majorVersion >= 9) {
      results.push({
        name: "pnpm",
        status: "pass",
        message: `pnpm ${version} installed`,
        details: { version, required: ">=9.0.0" },
      });
    } else {
      results.push({
        name: "pnpm",
        status: "warn",
        message: `pnpm ${version} is below recommended 9.0.0`,
        details: { version, required: ">=9.0.0" },
      });
    }
  } else {
    results.push({
      name: "pnpm",
      status: "warn",
      message: "pnpm not found (npm can be used as fallback)",
    });
  }

  // Python (optional)
  const pythonResult = runCommand("python3 --version");
  if (pythonResult.success) {
    const version = pythonResult.output.replace("Python ", "");
    results.push({
      name: "Python",
      status: "pass",
      message: `Python ${version} installed`,
      details: { version },
    });
  } else {
    results.push({
      name: "Python",
      status: "warn",
      message: "Python not found (optional for data tools)",
    });
  }

  // Git
  const gitResult = runCommand("git --version");
  if (gitResult.success) {
    results.push({
      name: "Git",
      status: "pass",
      message: gitResult.output,
    });
  } else {
    results.push({
      name: "Git",
      status: "warn",
      message: "Git not found",
    });
  }

  // OS Info
  results.push({
    name: "Operating System",
    status: "pass",
    message: `${os.platform()} ${os.release()}`,
    details: {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      memory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`,
    },
  });

  return results;
}

function checkDependencies(projectPath: string): CheckResult[] {
  const results: CheckResult[] = [];

  // Check package.json exists
  const packageJsonPath = join(projectPath, "package.json");
  if (!existsSync(packageJsonPath)) {
    results.push({
      name: "package.json",
      status: "fail",
      message: "package.json not found",
    });
    return results;
  }

  try {
    const packageJson = safeJsonParse<Record<string, unknown>>(
      readFileSync(packageJsonPath, "utf-8"),
    );
    results.push({
      name: "package.json",
      status: "pass",
      message: `Project: ${(packageJson.name as string) || "unnamed"}`,
      details: {
        name: packageJson.name,
        version: packageJson.version,
        type: packageJson.type,
      },
    });
  } catch {
    results.push({
      name: "package.json",
      status: "fail",
      message: "Invalid package.json",
    });
    return results;
  }

  // Check node_modules
  const nodeModulesPath = join(projectPath, "node_modules");
  if (existsSync(nodeModulesPath)) {
    results.push({
      name: "node_modules",
      status: "pass",
      message: "Dependencies installed",
    });
  } else {
    results.push({
      name: "node_modules",
      status: "fail",
      message: 'Dependencies not installed. Run "pnpm install"',
    });
  }

  // Check lock file
  const pnpmLockPath = join(projectPath, "pnpm-lock.yaml");
  const npmLockPath = join(projectPath, "package-lock.json");
  if (existsSync(pnpmLockPath)) {
    results.push({
      name: "Lock file",
      status: "pass",
      message: "pnpm-lock.yaml found",
    });
  } else if (existsSync(npmLockPath)) {
    results.push({
      name: "Lock file",
      status: "pass",
      message: "package-lock.json found",
    });
  } else {
    results.push({
      name: "Lock file",
      status: "warn",
      message: "No lock file found",
    });
  }

  return results;
}

function checkConfiguration(projectPath: string): CheckResult[] {
  const results: CheckResult[] = [];

  // Check tsconfig.json
  const tsconfigPath = join(projectPath, "tsconfig.json");
  if (existsSync(tsconfigPath)) {
    results.push({
      name: "tsconfig.json",
      status: "pass",
      message: "TypeScript configured",
    });
  } else {
    results.push({
      name: "tsconfig.json",
      status: "warn",
      message: "tsconfig.json not found",
    });
  }

  // Check biome.json or .eslintrc
  const biomePath = join(projectPath, "biome.json");
  const eslintPath = join(projectPath, ".eslintrc.json");
  if (existsSync(biomePath)) {
    results.push({
      name: "Linter",
      status: "pass",
      message: "Biome configured",
    });
  } else if (existsSync(eslintPath)) {
    results.push({
      name: "Linter",
      status: "pass",
      message: "ESLint configured",
    });
  } else {
    results.push({
      name: "Linter",
      status: "warn",
      message: "No linter configured",
    });
  }

  // Check .gitignore
  const gitignorePath = join(projectPath, ".gitignore");
  if (existsSync(gitignorePath)) {
    results.push({
      name: ".gitignore",
      status: "pass",
      message: ".gitignore found",
    });
  } else {
    results.push({
      name: ".gitignore",
      status: "warn",
      message: ".gitignore not found",
    });
  }

  // Check .claude directory
  const claudePath = join(projectPath, ".claude");
  if (existsSync(claudePath)) {
    results.push({
      name: "Claude Config",
      status: "pass",
      message: ".claude directory found",
    });
  } else {
    results.push({
      name: "Claude Config",
      status: "warn",
      message: ".claude directory not found (optional)",
    });
  }

  return results;
}

function checkMCP(): CheckResult[] {
  const results: CheckResult[] = [];

  // Check if we're running in an MCP context
  // This is a basic check - in reality, the tool is running if this code executes
  results.push({
    name: "MCP Server",
    status: "pass",
    message: "Flynn MCP server is running",
    details: {
      server: "flynn-mcp-server",
      transport: "stdio",
    },
  });

  // Check Claude Code settings
  const claudeSettingsPath = join(os.homedir(), ".claude", "settings.json");
  if (existsSync(claudeSettingsPath)) {
    try {
      const settings = safeJsonParse<Record<string, unknown>>(
        readFileSync(claudeSettingsPath, "utf-8"),
      );
      const mcpServers = settings.mcpServers as Record<string, unknown> | undefined;
      const hasMcpServers = mcpServers && Object.keys(mcpServers).length > 0;
      if (hasMcpServers && mcpServers) {
        results.push({
          name: "MCP Configuration",
          status: "pass",
          message: `${Object.keys(mcpServers).length} MCP server(s) configured`,
          details: { servers: Object.keys(mcpServers) },
        });
      } else {
        results.push({
          name: "MCP Configuration",
          status: "warn",
          message: "No MCP servers configured in settings.json",
        });
      }
    } catch {
      results.push({
        name: "MCP Configuration",
        status: "warn",
        message: "Could not parse Claude settings.json",
      });
    }
  } else {
    results.push({
      name: "MCP Configuration",
      status: "warn",
      message: "Claude settings.json not found",
    });
  }

  return results;
}

export const healthCheckTool = createTool({
  id: "health-check",
  description:
    "Perform system health checks including environment, dependencies, and configuration validation.",
  inputSchema,
  outputSchema,
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: orchestrates selectable checks and reporting in a single tool
  execute: async (input) => {
    // Handle Mastra's context wrapping
    const data = input as {
      context?: { checks?: string[]; projectPath?: string };
      checks?: string[];
      projectPath?: string;
    };

    const checksInput = data?.context?.checks || data?.checks || ["all"];
    const projectPath = data?.context?.projectPath || data?.projectPath || process.cwd();
    const runAll = checksInput.includes("all");

    const allResults: CheckResult[] = [];
    const recommendations: string[] = [];

    // Run selected checks
    if (runAll || checksInput.includes("environment")) {
      allResults.push(...checkEnvironment());
    }

    if (runAll || checksInput.includes("dependencies")) {
      allResults.push(...checkDependencies(projectPath));
    }

    if (runAll || checksInput.includes("configuration")) {
      allResults.push(...checkConfiguration(projectPath));
    }

    if (runAll || checksInput.includes("mcp")) {
      allResults.push(...checkMCP());
    }

    // Calculate summary
    const passed = allResults.filter((r) => r.status === "pass").length;
    const failed = allResults.filter((r) => r.status === "fail").length;
    const warnings = allResults.filter((r) => r.status === "warn").length;

    // Generate recommendations
    for (const result of allResults) {
      if (result.status === "fail") {
        if (result.name === "Node.js") {
          recommendations.push("Install Node.js 20+ from https://nodejs.org/");
        } else if (result.name === "node_modules") {
          recommendations.push('Run "pnpm install" to install dependencies');
        } else if (result.name === "package.json") {
          recommendations.push('Run "pnpm init" to create package.json');
        }
      }
      if (result.status === "warn") {
        if (result.name === "pnpm") {
          recommendations.push('Install pnpm: "npm install -g pnpm"');
        } else if (result.name === "Linter") {
          recommendations.push('Set up Biome: "pnpm add -D @biomejs/biome && npx biome init"');
        }
      }
    }

    return {
      healthy: failed === 0,
      timestamp: new Date().toISOString(),
      summary: {
        passed,
        failed,
        warnings,
      },
      checks: allResults,
      recommendations,
    };
  },
});

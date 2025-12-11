/**
 * Health Command
 *
 * Run system health checks.
 */

import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import { promisify } from "node:util";
import chalk from "chalk";
import { Command } from "commander";
import ora from "ora";
import { printError, printSuccess, printWarning } from "../utils/display.js";

const execAsync = promisify(exec);

interface HealthCheck {
  name: string;
  status: "pass" | "fail" | "warn";
  message: string;
  duration?: number;
}

export const healthCommand = new Command("health")
  .description("Run system health checks")
  .option("-v, --verbose", "Show detailed output")
  .action(async (options) => {
    await runHealthChecks(options.verbose);
  });

/**
 * Run all health checks
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: combines environment, dependency, and config checks in one flow
async function runHealthChecks(verbose = false): Promise<void> {
  console.log(`\n${chalk.cyan.bold("Flynn Health Check")}\n`);

  const checks: HealthCheck[] = [];

  // Environment checks
  const spinner = ora("Checking environment...").start();

  // Node.js version
  checks.push(await checkNodeVersion());

  // pnpm availability
  checks.push(await checkPnpm());

  // Git availability
  checks.push(await checkGit());

  // Python (optional)
  checks.push(await checkPython());

  spinner.succeed("Environment checks complete");

  // Dependency checks
  spinner.start("Checking dependencies...");

  // package.json
  checks.push(checkPackageJson());

  // node_modules
  checks.push(checkNodeModules());

  spinner.succeed("Dependency checks complete");

  // Configuration checks
  spinner.start("Checking configuration...");

  // tsconfig.json
  checks.push(checkTsConfig());

  // .claude directory
  checks.push(checkClaudeConfig());

  spinner.succeed("Configuration checks complete");

  // Display results
  console.log(`\n${chalk.gray("─".repeat(50))}\n`);

  let passed = 0;
  let failed = 0;
  let warnings = 0;

  for (const check of checks) {
    const icon =
      check.status === "pass"
        ? chalk.green("✔")
        : check.status === "warn"
          ? chalk.yellow("⚠")
          : chalk.red("✖");

    const name = chalk.white(check.name.padEnd(25));
    const message =
      check.status === "pass"
        ? chalk.gray(check.message)
        : check.status === "warn"
          ? chalk.yellow(check.message)
          : chalk.red(check.message);

    console.log(`  ${icon} ${name} ${message}`);

    if (verbose && check.duration) {
      console.log(chalk.gray(`      (${check.duration}ms)`));
    }

    if (check.status === "pass") passed++;
    else if (check.status === "warn") warnings++;
    else failed++;
  }

  // Summary
  console.log(`\n${chalk.gray("─".repeat(50))}`);
  console.log(
    `\n  Summary: ${chalk.green(`${passed} passed`)}, ${chalk.yellow(
      `${warnings} warnings`,
    )}, ${chalk.red(`${failed} failed`)}\n`,
  );

  if (failed > 0) {
    printError("Some checks failed. Please resolve the issues above.");
    process.exit(1);
  } else if (warnings > 0) {
    printWarning("Some checks have warnings. Consider resolving them.");
  } else {
    printSuccess("All health checks passed!");
  }
}

/**
 * Check Node.js version
 */
async function checkNodeVersion(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const { stdout } = await execAsync("node --version");
    const version = stdout.trim().replace("v", "");
    const major = Number.parseInt(version.split(".")[0] ?? "0", 10);

    if (major >= 20) {
      return {
        name: "Node.js",
        status: "pass",
        message: `v${version}`,
        duration: Date.now() - start,
      };
    }
    if (major >= 18) {
      return {
        name: "Node.js",
        status: "warn",
        message: `v${version} (recommend v20+)`,
        duration: Date.now() - start,
      };
    }
    return {
      name: "Node.js",
      status: "fail",
      message: `v${version} (requires v18+)`,
      duration: Date.now() - start,
    };
  } catch {
    return {
      name: "Node.js",
      status: "fail",
      message: "Not found",
      duration: Date.now() - start,
    };
  }
}

/**
 * Check pnpm availability
 */
async function checkPnpm(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const { stdout } = await execAsync("pnpm --version");
    return {
      name: "pnpm",
      status: "pass",
      message: `v${stdout.trim()}`,
      duration: Date.now() - start,
    };
  } catch {
    return {
      name: "pnpm",
      status: "fail",
      message: "Not found (npm i -g pnpm)",
      duration: Date.now() - start,
    };
  }
}

/**
 * Check Git availability
 */
async function checkGit(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const { stdout } = await execAsync("git --version");
    const version = stdout.match(/git version ([\d.]+)/)?.[1] || "unknown";
    return {
      name: "Git",
      status: "pass",
      message: `v${version}`,
      duration: Date.now() - start,
    };
  } catch {
    return {
      name: "Git",
      status: "fail",
      message: "Not found",
      duration: Date.now() - start,
    };
  }
}

/**
 * Check Python availability (optional)
 */
async function checkPython(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const { stdout } = await execAsync("python3 --version");
    const version = stdout.match(/Python ([\d.]+)/)?.[1] || "unknown";
    return {
      name: "Python",
      status: "pass",
      message: `v${version}`,
      duration: Date.now() - start,
    };
  } catch {
    return {
      name: "Python",
      status: "warn",
      message: "Not found (optional)",
      duration: Date.now() - start,
    };
  }
}

/**
 * Check package.json exists
 */
function checkPackageJson(): HealthCheck {
  if (existsSync("package.json")) {
    return {
      name: "package.json",
      status: "pass",
      message: "Found",
    };
  }
  return {
    name: "package.json",
    status: "fail",
    message: "Not found",
  };
}

/**
 * Check node_modules exists
 */
function checkNodeModules(): HealthCheck {
  if (existsSync("node_modules")) {
    return {
      name: "node_modules",
      status: "pass",
      message: "Found",
    };
  }
  return {
    name: "node_modules",
    status: "warn",
    message: "Not found (run pnpm install)",
  };
}

/**
 * Check tsconfig.json exists
 */
function checkTsConfig(): HealthCheck {
  if (existsSync("tsconfig.json")) {
    return {
      name: "tsconfig.json",
      status: "pass",
      message: "Found",
    };
  }
  return {
    name: "tsconfig.json",
    status: "warn",
    message: "Not found (optional)",
  };
}

/**
 * Check .claude directory exists
 */
function checkClaudeConfig(): HealthCheck {
  if (existsSync(".claude") || existsSync(".claude/commands")) {
    return {
      name: ".claude config",
      status: "pass",
      message: "Found",
    };
  }
  return {
    name: ".claude config",
    status: "warn",
    message: "Not found (optional)",
  };
}

#!/usr/bin/env node
/**
 * Flynn Bootstrap CLI
 * Entry point: npx @flynn/bootstrap
 */

import { existsSync } from "node:fs";
import { createLogger } from "@flynn/core";
import { detectEnvironment, printEnvironmentSummary } from "./detector/index.js";
import { runCommand } from "./installer/idempotent.js";
import { printInstallResults, runInstallers } from "./installer/index.js";
import { runValidation } from "./validator/index.js";

const logger = createLogger("bootstrap");

/**
 * Install project dependencies using pnpm
 */
async function installProjectDependencies(): Promise<{ success: boolean; error?: string }> {
  // Check if we're in a pnpm workspace
  if (!existsSync("pnpm-workspace.yaml") && !existsSync("package.json")) {
    return { success: false, error: "No package.json or pnpm-workspace.yaml found" };
  }

  logger.info("Installing project dependencies with pnpm...");

  // Run pnpm install with inherited stdio for progress display
  const result = runCommand("pnpm install --frozen-lockfile", { stdio: "inherit" });

  if (!result.success) {
    // Try without frozen lockfile (for fresh installs)
    logger.info("Retrying without frozen lockfile...");
    const retryResult = runCommand("pnpm install", { stdio: "inherit" });

    if (!retryResult.success) {
      return { success: false, error: retryResult.error };
    }
  }

  // Run build to compile TypeScript
  logger.info("Building project...");
  const buildResult = runCommand("pnpm build", { stdio: "inherit" });

  if (!buildResult.success) {
    return { success: false, error: `Build failed: ${buildResult.error}` };
  }

  return { success: true };
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "full";

  console.log("\n╔════════════════════════════════════════╗");
  console.log("║      Flynn Bootstrap Installer         ║");
  console.log("╚════════════════════════════════════════╝\n");

  switch (command) {
    case "detect":
    case "env": {
      logger.info("Detecting environment...");
      const env = await detectEnvironment();
      printEnvironmentSummary(env);
      break;
    }

    case "install": {
      logger.info("Running installers...");
      const results = await runInstallers({ verbose: args.includes("--verbose") });
      printInstallResults(results);
      break;
    }

    case "validate":
    case "check": {
      logger.info("Running validation...");
      await runValidation("all");
      break;
    }

    case "help":
    case "--help":
    case "-h": {
      console.log("Usage: npx @flynn/bootstrap [command]\n");
      console.log("Commands:");
      console.log("  full      Run full bootstrap (default)");
      console.log("            1. Detect environment");
      console.log("            2. Install system tools (pnpm, uv, Claude Code)");
      console.log("            3. Install project dependencies (pnpm install + build)");
      console.log("            4. Validate installation");
      console.log("  detect    Detect environment only");
      console.log("  install   Run system tool installers only");
      console.log("  validate  Run validation only");
      console.log("  help      Show this help\n");
      console.log("Options:");
      console.log("  --verbose  Show detailed output\n");
      break;
    }
    default: {
      // Full bootstrap flow
      logger.info("Starting full bootstrap...");

      // Step 1: Detect environment
      console.log("Step 1/4: Detecting environment...\n");
      const env = await detectEnvironment();
      printEnvironmentSummary(env);

      // Step 2: Run installers (system tools)
      console.log("Step 2/4: Installing system tools...\n");
      const installResults = await runInstallers();
      printInstallResults(installResults);

      // Step 3: Install project dependencies
      console.log("Step 3/4: Installing project dependencies...\n");
      const projectDepsResult = await installProjectDependencies();
      if (!projectDepsResult.success) {
        console.log(`✗ Failed to install project dependencies: ${projectDepsResult.error}\n`);
        logger.error(
          { error: projectDepsResult.error },
          "Project dependencies installation failed",
        );
      } else {
        console.log("✓ Project dependencies installed successfully\n");
      }

      // Step 4: Validate
      console.log("Step 4/4: Validating installation...\n");
      const report = await runValidation("all");

      // Summary
      if (report.allValid && projectDepsResult.success) {
        console.log("✓ Flynn bootstrap completed successfully!\n");
        console.log("Next steps:");
        console.log("  1. Use /flynn in Claude Code\n");
      } else {
        console.log("✗ Bootstrap completed with issues. See validation report above.\n");
        process.exit(1);
      }
      break;
    }
  }
}

main().catch((error) => {
  logger.error({ error }, "Bootstrap failed");
  console.error("\n✗ Bootstrap failed:", error.message);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Flynn Bootstrap CLI
 * Entry point: npx @flynn/bootstrap
 */

import { createLogger } from "@flynn/core";
import { detectEnvironment, printEnvironmentSummary } from "./detector/index.js";
import { printInstallResults, runInstallers } from "./installer/index.js";
import { runValidation } from "./validator/index.js";

const logger = createLogger("bootstrap");

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
      console.log("  detect    Detect environment only");
      console.log("  install   Run installers only");
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
      console.log("Step 1/3: Detecting environment...\n");
      const env = await detectEnvironment();
      printEnvironmentSummary(env);

      // Step 2: Run installers
      console.log("Step 2/3: Installing dependencies...\n");
      const installResults = await runInstallers();
      printInstallResults(installResults);

      // Step 3: Validate
      console.log("Step 3/3: Validating installation...\n");
      const report = await runValidation("all");

      // Summary
      if (report.allValid) {
        console.log("✓ Flynn bootstrap completed successfully!\n");
        console.log("Next steps:");
        console.log("  1. cd your-project");
        console.log("  2. pnpm install");
        console.log("  3. Use /flynn in Claude Code\n");
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

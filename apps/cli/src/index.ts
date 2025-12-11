#!/usr/bin/env node

/**
 * Flynn CLI
 *
 * Command-line interface for the Flynn Expert System.
 * Provides access to analytics, health checks, and plugin management.
 */

import chalk from "chalk";
import { Command } from "commander";
import { analyticsCommand } from "./commands/analytics.js";
import { healthCommand } from "./commands/health.js";
import { monitorCommand } from "./commands/monitor.js";
import { pluginsCommand } from "./commands/plugins.js";
import { setupCommand } from "./commands/setup.js";
import { runCommand } from "./commands/run.js";
import { scanCommand } from "./commands/scan.js";
import { cacheCommand } from "./commands/cache.js";

const VERSION = "1.0.0";

const program = new Command();

program
  .name("flynn")
  .description(
    `${chalk.cyan("Flynn Expert System CLI")}

Commands for analytics, health checks, and plugin management.`,
  )
  .version(VERSION, "-v, --version", "Display version number");

// Register subcommands
program.addCommand(analyticsCommand);
program.addCommand(healthCommand);
program.addCommand(pluginsCommand);
program.addCommand(monitorCommand);
program.addCommand(setupCommand);
program.addCommand(runCommand);
program.addCommand(scanCommand);
program.addCommand(cacheCommand);

// Default action: show help
program.action(() => {
  console.log(
    chalk.cyan(`
  ███████╗██╗  ██╗   ██╗███╗   ██╗███╗   ██╗
  ██╔════╝██║  ╚██╗ ██╔╝████╗  ██║████╗  ██║
  █████╗  ██║   ╚████╔╝ ██╔██╗ ██║██╔██╗ ██║
  ██╔══╝  ██║    ╚██╔╝  ██║╚██╗██║██║╚██╗██║
  ██║     ███████╗██║   ██║ ╚████║██║ ╚████║
  ╚═╝     ╚══════╝╚═╝   ╚═╝  ╚═══╝╚═╝  ╚═══╝
`),
  );
  console.log(chalk.gray(`  Expert System CLI v${VERSION}\n`));
  program.outputHelp();
});

// Parse arguments
program.parse();

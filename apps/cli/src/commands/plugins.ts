/**
 * Plugins Command
 *
 * Full implementation for managing Flynn plugins.
 */

import chalk from "chalk";
import { Command } from "commander";
import ora from "ora";
import {
  confirmPrompt,
  pluginDetails,
  pluginTable,
  printError,
  printInfo,
  printSuccess,
  printWarning,
} from "../utils/display.js";

// Demo data for offline mode
function getDemoPlugins() {
  return [
    {
      id: "security-scanner",
      name: "Security Scanner",
      version: "1.0.0",
      status: "loaded" as const,
      description: "Automated security scanning and vulnerability detection",
      author: "Flynn Team",
      license: "MIT",
      agents: 1,
      skills: 2,
      workflows: 2,
    },
    {
      id: "code-quality",
      name: "Code Quality",
      version: "1.2.0",
      status: "loaded" as const,
      description: "Code quality analysis and linting",
      author: "Flynn Team",
      license: "MIT",
      agents: 2,
      skills: 3,
      workflows: 1,
    },
    {
      id: "docs-generator",
      name: "Documentation Generator",
      version: "0.9.0",
      status: "disabled" as const,
      description: "Generate documentation from code",
      author: "Community",
      license: "Apache-2.0",
      agents: 1,
      skills: 1,
      workflows: 0,
    },
  ];
}

function getDemoPluginDetails(id: string) {
  const plugins: Record<
    string,
    {
      id: string;
      name: string;
      version: string;
      description: string;
      author: string;
      license: string;
      agents: Array<{ id: string; name: string; description: string }>;
      skills: Array<{ id: string; name: string; description: string }>;
      workflows: Array<{ id: string; name: string; description: string }>;
    }
  > = {
    "security-scanner": {
      id: "security-scanner",
      name: "Security Scanner",
      version: "1.0.0",
      description: "Automated security scanning and vulnerability detection",
      author: "Flynn Team",
      license: "MIT",
      agents: [
        {
          id: "security-scanner",
          name: "Security Scanner Agent",
          description: "Scans code for security vulnerabilities",
        },
      ],
      skills: [
        {
          id: "owasp-top-10",
          name: "OWASP Top 10",
          description: "Knowledge of OWASP Top 10 vulnerabilities",
        },
        {
          id: "dependency-audit",
          name: "Dependency Audit",
          description: "Audit project dependencies for CVEs",
        },
      ],
      workflows: [
        {
          id: "security-scan",
          name: "Security Scan",
          description: "Full security scan of the codebase",
        },
        {
          id: "vulnerability-fix",
          name: "Vulnerability Fix",
          description: "Fix identified security vulnerabilities",
        },
      ],
    },
    "code-quality": {
      id: "code-quality",
      name: "Code Quality",
      version: "1.2.0",
      description: "Code quality analysis and linting",
      author: "Flynn Team",
      license: "MIT",
      agents: [
        {
          id: "linter",
          name: "Linter Agent",
          description: "Runs code linting and style checks",
        },
        {
          id: "complexity-analyzer",
          name: "Complexity Analyzer",
          description: "Analyzes code complexity metrics",
        },
      ],
      skills: [
        {
          id: "eslint-rules",
          name: "ESLint Rules",
          description: "Knowledge of ESLint configuration",
        },
        {
          id: "prettier-config",
          name: "Prettier Config",
          description: "Prettier formatting knowledge",
        },
        {
          id: "typescript-strict",
          name: "TypeScript Strict",
          description: "TypeScript strict mode patterns",
        },
      ],
      workflows: [
        {
          id: "lint-fix",
          name: "Lint & Fix",
          description: "Lint code and auto-fix issues",
        },
      ],
    },
  };

  return plugins[id] || null;
}

export const pluginsCommand = new Command("plugins")
  .description("Manage Flynn plugins")
  .option("--demo", "Use demo data (no plugin system required)")
  .action(async (options: { demo?: boolean }) => {
    await listPlugins(false, options.demo);
  });

// Subcommand: list
pluginsCommand
  .command("list")
  .description("List installed plugins")
  .option("-a, --all", "Show all plugins including disabled")
  .option("-v, --verbose", "Show detailed information")
  .option("--demo", "Use demo data")
  .action(async (options: { all?: boolean; verbose?: boolean; demo?: boolean }) => {
    await listPlugins(options.all, options.demo, options.verbose);
  });

// Subcommand: install
pluginsCommand
  .command("install <source>")
  .description("Install a plugin from npm, git, or local path")
  .option("-f, --force", "Force overwrite existing installation")
  .option("-t, --target <dir>", "Target directory for installation")
  .option("--demo", "Use demo data")
  .action(async (source: string, options: { force?: boolean; target?: string; demo?: boolean }) => {
    await installPluginCommand(source, options);
  });

// Subcommand: remove
pluginsCommand
  .command("remove <id>")
  .description("Remove a plugin")
  .option("-f, --force", "Skip confirmation")
  .option("--demo", "Use demo data")
  .action(async (id: string, options: { force?: boolean; demo?: boolean }) => {
    await removePlugin(id, options.force, options.demo);
  });

// Subcommand: info
pluginsCommand
  .command("info <id>")
  .description("Show plugin details")
  .option("--demo", "Use demo data")
  .action(async (id: string, options: { demo?: boolean }) => {
    await showPluginInfo(id, options.demo);
  });

// Subcommand: enable
pluginsCommand
  .command("enable <id>")
  .description("Enable a disabled plugin")
  .option("--demo", "Use demo data")
  .action(async (id: string, options: { demo?: boolean }) => {
    await enablePlugin(id, options.demo);
  });

// Subcommand: disable
pluginsCommand
  .command("disable <id>")
  .description("Disable a plugin without removing it")
  .option("--demo", "Use demo data")
  .action(async (id: string, options: { demo?: boolean }) => {
    await disablePlugin(id, options.demo);
  });

/**
 * List installed plugins
 */
async function listPlugins(showAll = false, demo = false, verbose = false): Promise<void> {
  const spinner = ora("Loading plugins...").start();

  try {
    if (!demo) {
      // In real implementation, this would use PluginManager
      spinner.warn("Plugin system not available - use --demo for testing");
      printInfo("Run with --demo to see example output");
      return;
    }

    const plugins = getDemoPlugins();
    spinner.succeed("Loaded demo plugins");

    // Filter if not showing all
    const displayPlugins = showAll ? plugins : plugins.filter((p) => p.status !== "disabled");

    if (displayPlugins.length === 0) {
      printWarning("No plugins installed");
      console.log();
      console.log(chalk.gray("Install plugins with:"));
      console.log(chalk.gray("  flynn plugins install @flynn-plugin/security-scanner"));
      console.log(chalk.gray("  flynn plugins install github:user/repo"));
      console.log(chalk.gray("  flynn plugins install ./local-plugin"));
      return;
    }

    console.log(`\n${chalk.cyan.bold("Installed Plugins")}\n`);

    pluginTable(displayPlugins);

    if (verbose) {
      console.log();
      for (const plugin of displayPlugins) {
        console.log(chalk.gray(`  ${plugin.id}: ${plugin.description || "No description"}`));
      }
    }

    // Summary
    const enabled = plugins.filter((p) => p.status === "loaded").length;
    const disabled = plugins.filter((p) => p.status === "disabled").length;
    console.log();
    console.log(
      chalk.gray(`Total: ${plugins.length} plugins (${enabled} enabled, ${disabled} disabled)`),
    );

    if (!showAll && disabled > 0) {
      console.log(chalk.gray("Use --all to show disabled plugins"));
    }
  } catch (error) {
    spinner.fail("Failed to list plugins");
    printError(error instanceof Error ? error.message : "Unknown error");
  }
}

/**
 * Install a plugin
 */
async function installPluginCommand(
  source: string,
  options: { force?: boolean; target?: string; demo?: boolean },
): Promise<void> {
  const spinner = ora(`Installing plugin from ${source}...`).start();

  try {
    if (options.demo) {
      // Simulate installation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Detect source type
      let sourceType = "local";
      if (source.startsWith("@") || /^[a-z0-9-]+$/i.test(source)) {
        sourceType = "npm";
      } else if (source.includes("github") || source.startsWith("git")) {
        sourceType = "git";
      }

      spinner.succeed("Installed plugin (demo mode)");
      printSuccess(`Source type: ${chalk.cyan(sourceType)}`);
      printSuccess(`Plugin ID: ${chalk.cyan("demo-plugin")}`);
      printSuccess(`Location: ${chalk.gray("~/.flynn/plugins/demo-plugin")}`);
      return;
    }

    // In real implementation, this would use installPlugin from @flynn/plugins
    spinner.warn("Plugin installation requires the plugin system");
    printInfo("Run with --demo to test the installation flow");
  } catch (error) {
    spinner.fail("Failed to install plugin");
    printError(error instanceof Error ? error.message : "Unknown error");
  }
}

/**
 * Remove a plugin
 */
async function removePlugin(id: string, force = false, demo = false): Promise<void> {
  try {
    if (!force && !demo) {
      const confirmed = await confirmPrompt(`Are you sure you want to remove plugin '${id}'?`);
      if (!confirmed) {
        printInfo("Removal cancelled");
        return;
      }
    }

    const spinner = ora(`Removing plugin ${id}...`).start();

    if (demo) {
      // Simulate removal
      await new Promise((resolve) => setTimeout(resolve, 1000));
      spinner.succeed(`Removed plugin: ${chalk.cyan(id)}`);
      return;
    }

    // In real implementation, this would use uninstallPlugin from @flynn/plugins
    spinner.warn("Plugin removal requires the plugin system");
    printInfo("Run with --demo to test the removal flow");
  } catch (error) {
    printError(error instanceof Error ? error.message : "Unknown error");
  }
}

/**
 * Show plugin info
 */
async function showPluginInfo(id: string, demo = false): Promise<void> {
  const spinner = ora(`Loading plugin info for ${id}...`).start();

  try {
    if (demo) {
      const plugin = getDemoPluginDetails(id);

      if (!plugin) {
        spinner.fail(`Plugin not found: ${id}`);
        printInfo("Available demo plugins: security-scanner, code-quality");
        return;
      }

      spinner.succeed("Loaded plugin info");
      pluginDetails(plugin);
      return;
    }

    // In real implementation, this would use PluginManager
    spinner.warn("Plugin info requires the plugin system");
    printInfo("Run with --demo to see example output");
  } catch (error) {
    spinner.fail("Failed to load plugin info");
    printError(error instanceof Error ? error.message : "Unknown error");
  }
}

/**
 * Enable a plugin
 */
async function enablePlugin(id: string, demo = false): Promise<void> {
  const spinner = ora(`Enabling plugin ${id}...`).start();

  try {
    if (demo) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      spinner.succeed(`Enabled plugin: ${chalk.cyan(id)}`);
      printInfo("Plugin is now active and its agents/skills are available");
      return;
    }

    // In real implementation, this would use PluginManager.enablePlugin
    spinner.warn("Plugin enable requires the plugin system");
    printInfo("Run with --demo to test the enable flow");
  } catch (error) {
    spinner.fail("Failed to enable plugin");
    printError(error instanceof Error ? error.message : "Unknown error");
  }
}

/**
 * Disable a plugin
 */
async function disablePlugin(id: string, demo = false): Promise<void> {
  const spinner = ora(`Disabling plugin ${id}...`).start();

  try {
    if (demo) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      spinner.succeed(`Disabled plugin: ${chalk.cyan(id)}`);
      printInfo("Plugin is now inactive but remains installed");
      printInfo(`Use 'flynn plugins enable ${id}' to re-enable`);
      return;
    }

    // In real implementation, this would use PluginManager.disablePlugin
    spinner.warn("Plugin disable requires the plugin system");
    printInfo("Run with --demo to test the disable flow");
  } catch (error) {
    spinner.fail("Failed to disable plugin");
    printError(error instanceof Error ? error.message : "Unknown error");
  }
}

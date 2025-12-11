/**
 * Display Utilities
 *
 * Formatting helpers for CLI output.
 */

import chalk from "chalk";
import Table from "cli-table3";

/**
 * Format a number with K/M suffix
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

/**
 * Format duration in milliseconds to human-readable
 */
export function formatDuration(ms: number): string {
  if (ms >= 60_000) return `${(ms / 60_000).toFixed(1)}m`;
  if (ms >= 1_000) return `${(ms / 1_000).toFixed(1)}s`;
  return `${ms}ms`;
}

/**
 * Format cost with dollar sign
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

/**
 * Format success rate with color
 */
export function formatSuccessRate(rate: number): string {
  const percentage = `${(rate * 100).toFixed(0)}%`;
  if (rate >= 0.95) return chalk.green(percentage);
  if (rate >= 0.8) return chalk.yellow(percentage);
  return chalk.red(percentage);
}

/**
 * Create a summary box
 */
export function summaryBox(title: string, items: Record<string, string>): void {
  console.log(`\n${chalk.cyan.bold(title)}`);
  console.log(chalk.gray("─".repeat(40)));

  for (const [label, value] of Object.entries(items)) {
    console.log(chalk.gray(`  ${label.padEnd(20)}`) + chalk.white.bold(value));
  }

  console.log();
}

/**
 * Create a data table
 */
export function dataTable(
  headers: string[],
  rows: string[][],
  _options: { head?: boolean } = {},
): void {
  const table = new Table({
    head: headers.map((h) => chalk.cyan(h)),
    style: {
      head: [],
      border: ["gray"],
    },
    chars: {
      top: "─",
      "top-mid": "┬",
      "top-left": "┌",
      "top-right": "┐",
      bottom: "─",
      "bottom-mid": "┴",
      "bottom-left": "└",
      "bottom-right": "┘",
      left: "│",
      "left-mid": "├",
      mid: "─",
      "mid-mid": "┼",
      right: "│",
      "right-mid": "┤",
      middle: "│",
    },
  });

  for (const row of rows) {
    table.push(row);
  }

  console.log(table.toString());
}

/**
 * Print error message
 */
export function printError(message: string): void {
  console.error(chalk.red("✖ Error:"), message);
}

/**
 * Print success message
 */
export function printSuccess(message: string): void {
  console.log(chalk.green("✔"), message);
}

/**
 * Print warning message
 */
export function printWarning(message: string): void {
  console.log(chalk.yellow("⚠"), message);
}

/**
 * Print info message
 */
export function printInfo(message: string): void {
  console.log(chalk.blue("ℹ"), message);
}

// ============================================
// Conversation Monitor Display Utilities
// ============================================

/**
 * Stream a line to stdout without newline (for real-time updates)
 */
export function streamLine(text: string, color?: string): void {
  const colorFns: Record<string, (value: string) => string> = {
    red: chalk.red,
    yellow: chalk.yellow,
    green: chalk.green,
    blue: chalk.blue,
    cyan: chalk.cyan,
    magenta: chalk.magenta,
    gray: chalk.gray,
  };

  const colorFn = color ? colorFns[color] : undefined;
  process.stdout.write(colorFn ? colorFn(text) : text);
}

/**
 * Clear the current line and write new content
 */
export function updateLine(text: string): void {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(text);
}

/**
 * Display token usage with color coding
 */
export function tokenUsageDisplay(inputTokens: number, outputTokens: number, cost: number): string {
  const total = inputTokens + outputTokens;
  const costColor = cost > 0.1 ? chalk.red : cost > 0.01 ? chalk.yellow : chalk.green;

  return (
    chalk.gray("Tokens: ") +
    chalk.cyan(formatNumber(inputTokens)) +
    chalk.gray(" in / ") +
    chalk.cyan(formatNumber(outputTokens)) +
    chalk.gray(" out ") +
    chalk.gray("(") +
    chalk.cyan(formatNumber(total)) +
    chalk.gray(" total) ") +
    chalk.gray("Cost: ") +
    costColor(formatCost(cost))
  );
}

/**
 * Display a progress bar
 */
export function progressBar(current: number, total: number, width = 20, label?: string): string {
  const percentage = Math.min(100, Math.round((current / total) * 100));
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;

  const bar = chalk.green("█".repeat(filled)) + chalk.gray("░".repeat(empty));

  const percentStr = `${percentage}%`.padStart(4);

  return label ? `${label} ${bar} ${chalk.cyan(percentStr)}` : `${bar} ${chalk.cyan(percentStr)}`;
}

/**
 * Display event type with icon
 */
export function eventIcon(
  type: "message" | "tool-start" | "tool-end" | "agent-decision" | "error",
): string {
  const icons = {
    message: chalk.blue("💬"),
    "tool-start": chalk.yellow("🔧"),
    "tool-end": chalk.green("✅"),
    "agent-decision": chalk.magenta("🧠"),
    error: chalk.red("❌"),
  };
  return icons[type] || chalk.gray("•");
}

/**
 * Format a timestamp for display
 */
export function formatTimestamp(date: Date): string {
  return chalk.gray(date.toISOString().replace("T", " ").slice(11, 19));
}

/**
 * Display a live event
 */
export function displayEvent(
  type: "message" | "tool-start" | "tool-end" | "agent-decision" | "error",
  content: string,
  details?: Record<string, string | number>,
): void {
  const icon = eventIcon(type);
  const timestamp = formatTimestamp(new Date());

  console.log(`${timestamp} ${icon} ${content}`);

  if (details) {
    for (const [key, value] of Object.entries(details)) {
      console.log(chalk.gray(`         ${key}: `) + chalk.white(String(value)));
    }
  }
}

// ============================================
// Plugin Display Utilities
// ============================================

/**
 * Display plugin table
 */
export function pluginTable(
  plugins: Array<{
    id: string;
    name: string;
    version: string;
    status: "loaded" | "disabled" | "error";
    agents?: number;
    skills?: number;
    workflows?: number;
  }>,
): void {
  const headers = ["Name", "Version", "Status", "Agents", "Skills", "Workflows"];

  const rows = plugins.map((p) => {
    const statusColor =
      p.status === "loaded" ? chalk.green : p.status === "disabled" ? chalk.gray : chalk.red;

    return [
      chalk.white.bold(p.name),
      chalk.cyan(p.version),
      statusColor(p.status),
      chalk.yellow(String(p.agents ?? 0)),
      chalk.blue(String(p.skills ?? 0)),
      chalk.magenta(String(p.workflows ?? 0)),
    ];
  });

  dataTable(headers, rows);
}

/**
 * Display detailed plugin info
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: structured output renderer for multiple plugin fields
export function pluginDetails(plugin: {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  agents?: Array<{ id: string; name: string; description?: string }>;
  skills?: Array<{ id: string; name: string; description?: string }>;
  workflows?: Array<{ id: string; name: string; description?: string }>;
}): void {
  console.log();
  console.log(chalk.cyan.bold(`Plugin: ${plugin.name}`));
  console.log(chalk.gray("─".repeat(50)));
  console.log(chalk.gray("  ID:          ") + chalk.white(plugin.id));
  console.log(chalk.gray("  Version:     ") + chalk.cyan(plugin.version));

  if (plugin.description) {
    console.log(chalk.gray("  Description: ") + chalk.white(plugin.description));
  }
  if (plugin.author) {
    console.log(chalk.gray("  Author:      ") + chalk.white(plugin.author));
  }
  if (plugin.license) {
    console.log(chalk.gray("  License:     ") + chalk.white(plugin.license));
  }

  if (plugin.agents && plugin.agents.length > 0) {
    console.log();
    console.log(chalk.yellow.bold("  Agents:"));
    for (const agent of plugin.agents) {
      console.log(chalk.yellow(`    • ${agent.name}`) + chalk.gray(` (${agent.id})`));
      if (agent.description) {
        console.log(chalk.gray(`      ${agent.description}`));
      }
    }
  }

  if (plugin.skills && plugin.skills.length > 0) {
    console.log();
    console.log(chalk.blue.bold("  Skills:"));
    for (const skill of plugin.skills) {
      console.log(chalk.blue(`    • ${skill.name}`) + chalk.gray(` (${skill.id})`));
      if (skill.description) {
        console.log(chalk.gray(`      ${skill.description}`));
      }
    }
  }

  if (plugin.workflows && plugin.workflows.length > 0) {
    console.log();
    console.log(chalk.magenta.bold("  Workflows:"));
    for (const workflow of plugin.workflows) {
      console.log(chalk.magenta(`    • ${workflow.name}`) + chalk.gray(` (${workflow.id})`));
      if (workflow.description) {
        console.log(chalk.gray(`      ${workflow.description}`));
      }
    }
  }

  console.log();
}

/**
 * Confirm prompt (returns true if user confirms)
 */
export async function confirmPrompt(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const readline = require("node:readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(chalk.yellow(`${message} [y/N] `), (answer: string) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

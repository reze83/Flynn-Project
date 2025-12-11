/**
 * Monitor Command
 *
 * Real-time conversation monitoring from the command line.
 */

import chalk from "chalk";
import { Command } from "commander";
import ora from "ora";
import {
  dataTable,
  formatCost,
  formatNumber,
  printError,
  printInfo,
  printSuccess,
  printWarning,
  summaryBox,
} from "../utils/display.js";

type TranscriptMessage = {
  id: number;
  sessionId: string;
  timestamp: Date | string;
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  toolName?: string;
  inputTokens?: number;
  outputTokens?: number;
};

type TranscriptResponse = {
  success: boolean;
  sessionId: string;
  messages: TranscriptMessage[];
};

type TokenUsageResponse = {
  success: boolean;
  sessionId: string;
  tokens: Array<{
    messageId: number;
    timestamp: Date | string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    model: "haiku" | "sonnet" | "opus";
    cumulativeInputTokens: number;
    cumulativeOutputTokens: number;
    cumulativeCost: number;
  }>;
  summary: {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    totalCost: number;
  };
};

type StatusResponse = {
  success: boolean;
  status: {
    active: boolean;
    sessionId: string;
    eventCount: number;
    debugMode: boolean;
    startedAt: Date | string;
  };
};

// Demo data for offline mode
function getDemoTranscript(): TranscriptResponse {
  const now = new Date();
  return {
    success: true,
    sessionId: "monitor-demo-session",
    messages: [
      {
        id: 1,
        sessionId: "monitor-demo-session",
        timestamp: new Date(now.getTime() - 300000),
        role: "user",
        content: "Help me fix the authentication bug in login.ts",
        inputTokens: 150,
        outputTokens: 0,
      },
      {
        id: 2,
        sessionId: "monitor-demo-session",
        timestamp: new Date(now.getTime() - 290000),
        role: "assistant",
        content: "I'll analyze the login.ts file to identify the authentication issue...",
        inputTokens: 0,
        outputTokens: 450,
      },
      {
        id: 3,
        sessionId: "monitor-demo-session",
        timestamp: new Date(now.getTime() - 280000),
        role: "tool",
        content: "Tool completed: file-ops (234ms)",
        toolName: "file-ops",
      },
      {
        id: 4,
        sessionId: "monitor-demo-session",
        timestamp: new Date(now.getTime() - 270000),
        role: "assistant",
        content:
          "Found the issue! The token validation is missing the expiry check. Let me fix it...",
        inputTokens: 0,
        outputTokens: 380,
      },
      {
        id: 5,
        sessionId: "monitor-demo-session",
        timestamp: new Date(now.getTime() - 260000),
        role: "tool",
        content: "Tool completed: file-ops (156ms)",
        toolName: "file-ops",
      },
      {
        id: 6,
        sessionId: "monitor-demo-session",
        timestamp: new Date(now.getTime() - 250000),
        role: "assistant",
        content:
          "The authentication bug has been fixed. The token now properly validates the expiry timestamp.",
        inputTokens: 0,
        outputTokens: 220,
      },
    ],
  };
}

function getDemoTokenUsage(): TokenUsageResponse {
  return {
    success: true,
    sessionId: "monitor-demo-session",
    tokens: [
      {
        messageId: 1,
        timestamp: new Date(Date.now() - 300000),
        inputTokens: 150,
        outputTokens: 0,
        cost: 0.00045,
        model: "sonnet",
        cumulativeInputTokens: 150,
        cumulativeOutputTokens: 0,
        cumulativeCost: 0.00045,
      },
      {
        messageId: 2,
        timestamp: new Date(Date.now() - 290000),
        inputTokens: 0,
        outputTokens: 450,
        cost: 0.00675,
        model: "sonnet",
        cumulativeInputTokens: 150,
        cumulativeOutputTokens: 450,
        cumulativeCost: 0.0072,
      },
      {
        messageId: 3,
        timestamp: new Date(Date.now() - 270000),
        inputTokens: 0,
        outputTokens: 380,
        cost: 0.0057,
        model: "sonnet",
        cumulativeInputTokens: 150,
        cumulativeOutputTokens: 830,
        cumulativeCost: 0.0129,
      },
      {
        messageId: 4,
        timestamp: new Date(Date.now() - 250000),
        inputTokens: 0,
        outputTokens: 220,
        cost: 0.0033,
        model: "sonnet",
        cumulativeInputTokens: 150,
        cumulativeOutputTokens: 1050,
        cumulativeCost: 0.0162,
      },
    ],
    summary: {
      totalInputTokens: 150,
      totalOutputTokens: 1050,
      totalTokens: 1200,
      totalCost: 0.0162,
    },
  };
}

function getDemoStatus(): StatusResponse {
  return {
    success: true,
    status: {
      active: true,
      sessionId: "monitor-demo-session",
      eventCount: 12,
      debugMode: false,
      startedAt: new Date(Date.now() - 300000),
    },
  };
}

export const monitorCommand = new Command("monitor")
  .description("Real-time conversation monitoring")
  .option("--demo", "Use demo data (no API required)")
  .action(async (options: { demo?: boolean }) => {
    await showStatus(options.demo);
  });

// Subcommand: start
monitorCommand
  .command("start")
  .description("Start monitoring a session")
  .option("-d, --debug", "Enable debug mode for detailed output")
  .option("-s, --session-id <id>", "Use a specific session ID")
  .option("--demo", "Use demo data")
  .action(async (options: { debug?: boolean; sessionId?: string; demo?: boolean }) => {
    await startMonitoring(options.debug, options.sessionId, options.demo);
  });

// Subcommand: status
monitorCommand
  .command("status")
  .description("Show current monitoring status")
  .option("--demo", "Use demo data")
  .action(async (options: { demo?: boolean }) => {
    await showStatus(options.demo);
  });

// Subcommand: stop
monitorCommand
  .command("stop")
  .description("Stop monitoring")
  .option("--demo", "Use demo data")
  .action(async (options: { demo?: boolean }) => {
    await stopMonitoring(options.demo);
  });

// Subcommand: transcript
monitorCommand
  .command("transcript")
  .description("Show conversation transcript")
  .option("-s, --session <id>", "Session ID to show")
  .option("-e, --export <format>", "Export format (json, markdown)")
  .option("-l, --limit <number>", "Limit number of messages", "50")
  .option("--demo", "Use demo data")
  .action(async (options: { session?: string; export?: string; limit: string; demo?: boolean }) => {
    await showTranscript(
      options.session,
      options.export,
      Number.parseInt(options.limit, 10),
      options.demo,
    );
  });

// Subcommand: tokens
monitorCommand
  .command("tokens")
  .description("Show token usage per message")
  .option("-s, --session <id>", "Session ID to show")
  .option("--demo", "Use demo data")
  .action(async (options: { session?: string; demo?: boolean }) => {
    await showTokens(options.session, options.demo);
  });

/**
 * Start monitoring
 */
async function startMonitoring(debug = false, sessionId?: string, demo = false): Promise<void> {
  const spinner = ora("Starting monitor...").start();

  try {
    if (demo) {
      spinner.succeed("Monitor started (demo mode)");
      const demoId = sessionId || `monitor-demo-${Date.now().toString(36)}`;
      printSuccess(`Monitoring session: ${chalk.cyan(demoId)}`);
      if (debug) {
        printInfo("Debug mode enabled - verbose output active");
      }
      printInfo("Use 'flynn monitor status' to check status");
      printInfo("Use 'flynn monitor transcript' to view conversation");
      printInfo("Use 'flynn monitor stop' to stop monitoring");
      return;
    }

    // In real implementation, this would call the API
    spinner.warn("Monitor API not available - use --demo for testing");
    printInfo("Real-time monitoring requires the Flynn API to be running");
  } catch (error) {
    spinner.fail("Failed to start monitor");
    printError(error instanceof Error ? error.message : "Unknown error");
  }
}

/**
 * Show monitoring status
 */
async function showStatus(demo = false): Promise<void> {
  const spinner = ora("Checking monitor status...").start();

  try {
    let data: StatusResponse;

    if (demo) {
      data = getDemoStatus();
      spinner.succeed("Loaded demo status");
    } else {
      // In real implementation, this would call the API
      spinner.warn("Monitor API not available - use --demo for testing");
      return;
    }

    if (!data.success) {
      printWarning("Could not get monitor status");
      return;
    }

    const status = data.status;
    const statusColor = status.active ? chalk.green : chalk.gray;
    const statusText = status.active ? "ACTIVE" : "INACTIVE";

    summaryBox("Monitor Status", {
      Status: statusColor(statusText),
      "Session ID": status.sessionId || "None",
      "Event Count": formatNumber(status.eventCount),
      "Debug Mode": status.debugMode ? chalk.yellow("ON") : chalk.gray("OFF"),
      "Started At": status.startedAt ? new Date(status.startedAt).toLocaleString() : "N/A",
    });
  } catch (error) {
    spinner.fail("Failed to get status");
    printError(error instanceof Error ? error.message : "Unknown error");
  }
}

/**
 * Stop monitoring
 */
async function stopMonitoring(demo = false): Promise<void> {
  const spinner = ora("Stopping monitor...").start();

  try {
    if (demo) {
      spinner.succeed("Monitor stopped (demo mode)");
      printSuccess("Monitoring session ended");
      printInfo("Transcript saved to storage");
      return;
    }

    // In real implementation, this would call the API
    spinner.warn("Monitor API not available - use --demo for testing");
  } catch (error) {
    spinner.fail("Failed to stop monitor");
    printError(error instanceof Error ? error.message : "Unknown error");
  }
}

/**
 * Show conversation transcript
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: demo-only transcript formatter handling multiple output modes
async function showTranscript(
  _sessionId?: string,
  exportFormat?: string,
  limit = 50,
  demo = false,
): Promise<void> {
  const spinner = ora("Fetching transcript...").start();

  try {
    let data: TranscriptResponse;

    if (demo) {
      data = getDemoTranscript();
      spinner.succeed("Loaded demo transcript");
    } else {
      // In real implementation, this would call the API
      spinner.warn("Monitor API not available - use --demo for testing");
      return;
    }

    if (!data.success || !data.messages?.length) {
      printWarning("No transcript available");
      return;
    }

    // Export if requested
    if (exportFormat) {
      if (exportFormat === "json") {
        console.log(JSON.stringify(data, null, 2));
      } else if (exportFormat === "markdown") {
        console.log(generateMarkdownTranscript(data.sessionId, data.messages));
      } else {
        printError(`Unknown export format: ${exportFormat}`);
      }
      return;
    }

    // Display transcript
    console.log();
    console.log(chalk.cyan.bold("Conversation Transcript"));
    console.log(chalk.gray(`Session: ${data.sessionId}`));
    console.log(chalk.gray("─".repeat(60)));
    console.log();

    const messages = data.messages.slice(-limit);
    for (const msg of messages) {
      const timestamp = new Date(msg.timestamp).toLocaleTimeString();
      const roleColors: Record<string, (text: string) => string> = {
        user: chalk.blue,
        assistant: chalk.green,
        tool: chalk.yellow,
        system: chalk.magenta,
      };
      const roleColor = roleColors[msg.role] || chalk.white;
      const roleIcon: Record<string, string> = {
        user: "👤",
        assistant: "🤖",
        tool: "🔧",
        system: "⚙️",
      };

      console.log(
        `${chalk.gray(`[${timestamp}]`)} ${roleIcon[msg.role]} ${roleColor(msg.role.toUpperCase())}`,
      );

      if (msg.toolName) {
        console.log(chalk.gray(`  Tool: ${msg.toolName}`));
      }

      // Truncate long content
      const content =
        msg.content.length > 200 ? `${msg.content.substring(0, 200)}...` : msg.content;
      console.log(chalk.white(`  ${content}`));

      if (msg.inputTokens || msg.outputTokens) {
        console.log(
          chalk.gray(`  Tokens: ${msg.inputTokens || 0} in / ${msg.outputTokens || 0} out`),
        );
      }

      console.log();
    }

    if (data.messages.length > limit) {
      printInfo(
        `Showing last ${limit} of ${data.messages.length} messages. Use --limit to show more.`,
      );
    }
  } catch (error) {
    spinner.fail("Failed to fetch transcript");
    printError(error instanceof Error ? error.message : "Unknown error");
  }
}

/**
 * Show token usage per message
 */
async function showTokens(_sessionId?: string, demo = false): Promise<void> {
  const spinner = ora("Fetching token usage...").start();

  try {
    let data: TokenUsageResponse;

    if (demo) {
      data = getDemoTokenUsage();
      spinner.succeed("Loaded demo token usage");
    } else {
      // In real implementation, this would call the API
      spinner.warn("Monitor API not available - use --demo for testing");
      return;
    }

    if (!data.success || !data.tokens?.length) {
      printWarning("No token usage data available");
      return;
    }

    // Summary
    summaryBox("Token Usage Summary", {
      "Session ID": data.sessionId,
      "Input Tokens": formatNumber(data.summary.totalInputTokens),
      "Output Tokens": formatNumber(data.summary.totalOutputTokens),
      "Total Tokens": formatNumber(data.summary.totalTokens),
      "Total Cost": formatCost(data.summary.totalCost),
    });

    // Per-message table
    console.log(`${chalk.cyan.bold("Token Usage Per Message")}\n`);

    const rows = data.tokens.map((t) => [
      chalk.gray(`#${t.messageId}`),
      chalk.cyan(formatNumber(t.inputTokens)),
      chalk.cyan(formatNumber(t.outputTokens)),
      formatCost(t.cost),
      chalk.gray(t.model),
      chalk.yellow(formatCost(t.cumulativeCost)),
    ]);

    dataTable(["#", "Input", "Output", "Cost", "Model", "Cumulative"], rows);
  } catch (error) {
    spinner.fail("Failed to fetch token usage");
    printError(error instanceof Error ? error.message : "Unknown error");
  }
}

/**
 * Generate markdown transcript
 */
function generateMarkdownTranscript(
  sessionId: string,
  messages: Array<{
    timestamp: Date | string;
    role: string;
    content: string;
    toolName?: string;
    inputTokens?: number;
    outputTokens?: number;
  }>,
): string {
  const lines: string[] = [
    "# Conversation Transcript",
    "",
    `**Session ID:** ${sessionId}`,
    `**Exported:** ${new Date().toISOString()}`,
    `**Messages:** ${messages.length}`,
    "",
    "---",
    "",
  ];

  for (const msg of messages) {
    const timestamp = new Date(msg.timestamp).toISOString().replace("T", " ").slice(0, 19);
    const roleIcon: Record<string, string> = {
      user: "👤",
      assistant: "🤖",
      tool: "🔧",
      system: "⚙️",
    };

    lines.push(`### ${roleIcon[msg.role] || "•"} ${msg.role.toUpperCase()} [${timestamp}]`);
    lines.push("");

    if (msg.toolName) {
      lines.push(`**Tool:** \`${msg.toolName}\``);
    }
    if (msg.inputTokens || msg.outputTokens) {
      lines.push(`**Tokens:** ${msg.inputTokens ?? 0} in / ${msg.outputTokens ?? 0} out`);
    }

    lines.push("");
    lines.push(msg.content);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

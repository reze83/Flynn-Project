/**
 * Analytics Command
 *
 * View Flynn usage analytics from the command line.
 */

import chalk from "chalk";
import { Command } from "commander";
import ora from "ora";
import {
  checkApiConnection,
  getAgentStats,
  getDemoAgentStats,
  getDemoSummary,
  getDemoToolStats,
  getSession,
  getSummary,
  getToolStats,
} from "../utils/api.js";
import {
  dataTable,
  formatCost,
  formatDuration,
  formatNumber,
  formatSuccessRate,
  printError,
  printWarning,
  summaryBox,
} from "../utils/display.js";

export const analyticsCommand = new Command("analytics")
  .description("View Flynn usage analytics")
  .option("--demo", "Use demo data (no API required)")
  .action(async (options: { demo?: boolean }) => {
    await showSummary(options.demo);
  });

// Subcommand: summary
analyticsCommand
  .command("summary")
  .description("Show analytics summary")
  .option("--demo", "Use demo data")
  .action(async (options) => {
    await showSummary(options.demo);
  });

// Subcommand: tools
analyticsCommand
  .command("tools")
  .description("Show tool usage statistics")
  .option("-l, --limit <number>", "Number of tools to show", "10")
  .option("--demo", "Use demo data")
  .action(async (options: { limit: string; demo?: boolean }) => {
    await showToolStats(Number.parseInt(options.limit, 10), options.demo);
  });

// Subcommand: agents
analyticsCommand
  .command("agents")
  .description("Show agent usage statistics")
  .option("-l, --limit <number>", "Number of agents to show", "10")
  .option("--demo", "Use demo data")
  .action(async (options: { limit: string; demo?: boolean }) => {
    await showAgentStats(Number.parseInt(options.limit, 10), options.demo);
  });

// Subcommand: session
analyticsCommand
  .command("session")
  .description("Show current session details")
  .option("--demo", "Use demo data")
  .action(async (options: { demo?: boolean }) => {
    await showSession(options.demo);
  });

/**
 * Show analytics summary
 */
async function showSummary(demo = false): Promise<void> {
  const spinner = ora("Fetching analytics summary...").start();

  try {
    let data: Awaited<ReturnType<typeof getSummary>>;

    if (demo) {
      data = getDemoSummary();
      spinner.succeed("Loaded demo data");
    } else {
      const connected = await checkApiConnection();
      if (!connected) {
        spinner.warn("API not available, using demo data");
        data = getDemoSummary();
      } else {
        data = await getSummary();
        spinner.succeed("Fetched analytics summary");
      }
    }

    if (!data.success) {
      printError("Failed to fetch summary");
      return;
    }

    const { summary } = data;

    summaryBox("Flynn Analytics Summary", {
      "Total Sessions": formatNumber(summary.totalSessions),
      "Total Tokens": formatNumber(summary.totalTokens),
      "Estimated Cost": formatCost(summary.totalCost),
      "Avg Tokens/Session": formatNumber(summary.avgTokensPerSession),
    });
  } catch (error) {
    spinner.fail("Failed to fetch analytics");
    printError(error instanceof Error ? error.message : "Unknown error");
  }
}

/**
 * Show tool statistics
 */
async function showToolStats(limit: number, demo = false): Promise<void> {
  const spinner = ora("Fetching tool statistics...").start();

  try {
    let data: Awaited<ReturnType<typeof getToolStats>>;

    if (demo) {
      data = getDemoToolStats();
      spinner.succeed("Loaded demo data");
    } else {
      const connected = await checkApiConnection();
      if (!connected) {
        spinner.warn("API not available, using demo data");
        data = getDemoToolStats();
      } else {
        data = await getToolStats(limit);
        spinner.succeed("Fetched tool statistics");
      }
    }

    if (!data.success || !data.toolStats?.length) {
      printWarning("No tool statistics available");
      return;
    }

    console.log(`\n${chalk.cyan.bold("Tool Usage Statistics")}\n`);

    const rows = data.toolStats.map((tool) => [
      chalk.white(tool.toolName),
      formatNumber(tool.count),
      formatDuration(tool.avgDuration),
      formatSuccessRate(tool.successRate),
    ]);

    dataTable(["Tool", "Count", "Avg Duration", "Success Rate"], rows);
  } catch (error) {
    spinner.fail("Failed to fetch tool statistics");
    printError(error instanceof Error ? error.message : "Unknown error");
  }
}

/**
 * Show agent statistics
 */
async function showAgentStats(limit: number, demo = false): Promise<void> {
  const spinner = ora("Fetching agent statistics...").start();

  try {
    let data: Awaited<ReturnType<typeof getAgentStats>>;

    if (demo) {
      data = getDemoAgentStats();
      spinner.succeed("Loaded demo data");
    } else {
      const connected = await checkApiConnection();
      if (!connected) {
        spinner.warn("API not available, using demo data");
        data = getDemoAgentStats();
      } else {
        data = await getAgentStats(limit);
        spinner.succeed("Fetched agent statistics");
      }
    }

    if (!data.success || !data.agentStats?.length) {
      printWarning("No agent statistics available");
      return;
    }

    console.log(`\n${chalk.cyan.bold("Agent Usage Statistics")}\n`);

    const rows = data.agentStats.map((agent) => [
      chalk.white(agent.agentId),
      formatNumber(agent.count),
      formatSuccessRate(agent.successRate),
      formatNumber(agent.avgTokens),
    ]);

    dataTable(["Agent", "Count", "Success Rate", "Avg Tokens"], rows);
  } catch (error) {
    spinner.fail("Failed to fetch agent statistics");
    printError(error instanceof Error ? error.message : "Unknown error");
  }
}

/**
 * Show current session details
 */
async function showSession(demo = false): Promise<void> {
  const spinner = ora("Fetching session details...").start();

  try {
    let data: Awaited<ReturnType<typeof getSession>>;

    if (demo) {
      data = {
        success: true,
        session: {
          sessionId: "flynn-demo-session",
          startedAt: new Date(Date.now() - 3600000).toISOString(),
          totalTokens: 45678,
          inputTokens: 12345,
          outputTokens: 33333,
          messageCount: 23,
          toolCallCount: 67,
          agentsUsed: ["coder", "diagnostic", "scaffolder"],
          workflowsExecuted: ["fix-bug", "new-feature"],
          estimatedCost: 0.68,
        },
      };
      spinner.succeed("Loaded demo data");
    } else {
      const connected = await checkApiConnection();
      if (!connected) {
        spinner.warn("API not available");
        printWarning("Cannot fetch session - API not available");
        return;
      }

      data = await getSession();
      spinner.succeed("Fetched session details");
    }

    if (!data.success || !data.session) {
      printWarning("No active session");
      return;
    }

    const session = data.session;
    const startTime = new Date(session.startedAt);
    const duration = Date.now() - startTime.getTime();

    summaryBox(`Session: ${session.sessionId}`, {
      Started: startTime.toLocaleString(),
      Duration: formatDuration(duration),
      Messages: session.messageCount.toString(),
      "Tool Calls": session.toolCallCount.toString(),
      "Total Tokens": formatNumber(session.totalTokens),
      "Input Tokens": formatNumber(session.inputTokens),
      "Output Tokens": formatNumber(session.outputTokens),
      "Estimated Cost": formatCost(session.estimatedCost),
      "Agents Used": session.agentsUsed.join(", ") || "None",
      Workflows: session.workflowsExecuted.join(", ") || "None",
    });
  } catch (error) {
    spinner.fail("Failed to fetch session");
    printError(error instanceof Error ? error.message : "Unknown error");
  }
}

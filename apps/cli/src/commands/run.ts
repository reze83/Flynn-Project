/**
 * Run Command
 *
 * Provides planning and optional execution of a multi‑agent workflow.
 * Users can specify a task description or an explicit workflow name. If no
 * task is provided, an interactive prompt asks for one. After planning
 * via the orchestrate tool, the planned agents are listed. When the
 * --execute flag is passed, the steps are executed sequentially or
 * concurrently based on configuration read from `.flynnrc.json` or
 * environment variables. Execution here simply logs instructions and
 * simulates work with a small delay.
 */

import { promises as fs } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import prompts from "prompts";

import { orchestrateTool } from "@flynn/tools";

interface PlannedAgent {
  id: string;
  role: string;
  subtask: string;
  instructions: string;
}

// Simple workflow runner for CLI demonstration
async function runWorkflowSteps(
  agents: PlannedAgent[],
  options: { parallel?: boolean; delay?: number },
): Promise<string[]> {
  const { parallel = false, delay = 100 } = options;
  const results: string[] = [];

  if (parallel) {
    await Promise.all(
      agents.map(async (agent) => {
        console.log(`[${agent.id}] Running...`);
        await new Promise((r) => setTimeout(r, delay));
        console.log(`[${agent.id}] Done`);
        results.push(agent.id);
      }),
    );
  } else {
    for (const agent of agents) {
      console.log(`[${agent.id}] Running...`);
      await new Promise((r) => setTimeout(r, delay));
      console.log(`[${agent.id}] Done`);
      results.push(agent.id);
    }
  }

  return results;
}

// Helper to load persisted configuration from .flynnrc.json
async function loadRc(): Promise<Record<string, unknown>> {
  try {
    const filePath = join(process.cwd(), ".flynnrc.json");
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export const runCommand = new Command("run")
  .description("Plan and optionally execute a workflow for a given task")
  .option("-t, --task <string>", "Task description")
  .option("-w, --workflow <string>", "Explicit workflow name")
  .option("--execute", "Execute the planned workflow after planning")
  .option("-c, --choose-template", "Interactively enter a workflow template instead of a task")
  .action(async (opts) => {
    // Determine the task and workflow from options or prompt
    let task: string | undefined = opts.task;
    let workflow: string | undefined = opts.workflow;
    // If chooseTemplate flag is set and no explicit workflow, ask for a workflow name
    if (opts.chooseTemplate && !workflow && !task) {
      const resp = await prompts({
        type: "text",
        name: "wf",
        message: "Enter workflow template name (e.g. fix-bug, new-project, full-stack-feature)",
      });
      workflow = resp.wf;
      if (!workflow) {
        console.log(chalk.yellow("No workflow provided; aborting."));
        return;
      }
    }
    // Otherwise, prompt for task if not provided
    if (!workflow && !task) {
      const response = await prompts({
        type: "text",
        name: "task",
        message: "Enter task description",
      });
      task = response.task;
      if (!task) {
        console.log(chalk.yellow("No task provided; aborting."));
        return;
      }
    }
    // Plan the workflow using the orchestrate tool
    const plan = await (
      orchestrateTool as {
        execute: (args: unknown) => Promise<{
          template: string;
          agents: Array<{ id: string; role: string; subtask: string }>;
          suggestedFlow: string;
        }>;
      }
    ).execute({
      context: {
        task: task || "",
        workflow,
        mode: "auto",
        parallel_threshold: 2,
        auto_optimize: true,
      },
    });
    console.log(chalk.green(`Planned template: ${plan.template}`));
    console.log(chalk.cyan("Agents:"));
    for (const a of plan.agents) {
      console.log(`  - ${a.id} (${a.role}): ${a.subtask}`);
    }
    console.log(chalk.cyan(`Suggested flow: ${plan.suggestedFlow}`));
    // If execution is requested, run the workflow steps
    if (opts.execute) {
      const rc = await loadRc();
      const envMode = process.env.FLYNN_PARALLEL_MODE;
      const defaultMode: string = (rc.FLYNN_PARALLEL_MODE as string) || plan.suggestedFlow;
      const mode = (envMode as string) || defaultMode;
      console.log(chalk.blue(`Executing workflow in ${mode} mode...`));
      // Use runWorkflowSteps to execute tasks; for demonstration, we simulate agent execution
      const results = await runWorkflowSteps(plan.agents as PlannedAgent[], {
        parallel: mode === "parallel",
        delay: 100,
      });
      console.log(chalk.green(`Execution finished: ${results.length} steps processed`));
    }
  });

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

import { Command } from "commander";
import chalk from "chalk";
import prompts from "prompts";
import { promises as fs } from "fs";
import { join } from "node:path";

import { orchestrateTool } from "@flynn/tools/src/orchestrate.js";
import { runWorkflow } from "@flynn/tools/src/workflow-runner.js";

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
    const plan = await orchestrateTool.execute({ task, workflow });
    console.log(chalk.green(`Planned template: ${plan.template}`));
    console.log(chalk.cyan("Agents:"));
    plan.agents.forEach((a: any) => {
      console.log(`  - ${a.id} (${a.role}): ${a.subtask}`);
    });
    console.log(chalk.cyan(`Suggested flow: ${plan.suggestedFlow}`));
    // If execution is requested, run the workflow steps
    if (opts.execute) {
      const rc = await loadRc();
      const envMode = process.env.FLYNN_PARALLEL_MODE;
      const envThresh = process.env.FLYNN_PARALLEL_THRESHOLD;
      const defaultMode: string = (rc.FLYNN_PARALLEL_MODE as string) || plan.suggestedFlow;
      const defaultThreshold: number = Number(rc.FLYNN_PARALLEL_THRESHOLD) || 2;
      const mode = (envMode as string) || defaultMode;
      const threshold = envThresh ? Number(envThresh) : defaultThreshold;
      console.log(
        chalk.blue(
          `Executing workflow in ${mode} mode (threshold ${threshold})...`,
        ),
      );
      // Use runWorkflow to execute tasks; for demonstration, we simulate agent execution
      const total = plan.agents.length;
      let index = 0;
      const results = await runWorkflow(
        plan.agents,
        mode as any,
        threshold,
        async (step: any) => {
          index++;
          console.log(
            chalk.yellow(`→ [${index}/${total}] ${step.id}: ${step.instructions}`),
          );
          // Simulate asynchronous work; in a real implementation, this would call the agent
          await new Promise((resolve) => setTimeout(resolve, 100));
          console.log(chalk.green(`✓ Completed ${step.id}`));
          return step.id;
        },
      );
      console.log(chalk.green(`Execution finished: ${results.length} steps processed`));
    }
  });
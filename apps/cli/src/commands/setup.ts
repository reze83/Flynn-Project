/**
 * Setup Command
 *
 * Provides an interactive wizard to configure Flynn. Users can set the
 * default orchestration mode and the threshold for parallel execution.
 * Configuration is persisted in a `.flynnrc.json` file at the project root
 * so that subsequent invocations can use these defaults. This command
 * demonstrates how to introduce rich CLI interactions using the `prompts`
 * library【434351357465319†L528-L557】.
 */

import { Command } from "commander";
import chalk from "chalk";
import prompts from "prompts";
import { promises as fs } from "fs";
import { join } from "node:path";

/**
 * Write configuration to a `.flynnrc.json` file. Existing keys will be
 * merged with the new values. The configuration is stored relative to
 * the current working directory (project root). If the file does not
 * exist, it will be created.
 */
async function saveConfig(config: Record<string, unknown>): Promise<void> {
  const filePath = join(process.cwd(), ".flynnrc.json");
  try {
    let existing: Record<string, unknown> = {};
    try {
      const content = await fs.readFile(filePath, "utf-8");
      existing = JSON.parse(content);
    } catch {
      // ignore read errors (file may not exist)
    }
    const merged = { ...existing, ...config };
    await fs.writeFile(filePath, JSON.stringify(merged, null, 2), "utf-8");
    console.log(chalk.green(`✔ Saved configuration to ${filePath}`));
  } catch (error) {
    console.error(chalk.red("Failed to write configuration:"), error);
  }
}

export const setupCommand = new Command("setup")
  .description("Interactively configure Flynn (parallel mode, threshold, etc.)")
  .action(async () => {
    console.log(chalk.cyan("\nFlynn Setup Wizard\n"));
    const questions = [
      {
        type: "select",
        name: "mode",
        message: "Select the default orchestration mode",
        choices: [
          { title: "Auto (mixed)", value: "auto" },
          { title: "Sequential", value: "sequential" },
          { title: "Parallel", value: "parallel" },
        ],
        initial: 0,
      },
      {
        type: "number",
        name: "threshold",
        message: "Minimum number of independent steps to trigger parallel execution",
        initial: 2,
        validate: (value: number) => (value > 0 ? true : "Please enter a positive number"),
      },
    ];

    const responses = await prompts(questions);
    if (!responses || typeof responses.mode === "undefined") {
      console.log(chalk.yellow("Setup cancelled."));
      return;
    }

    // Persist responses
    await saveConfig({
      FLYNN_PARALLEL_MODE: responses.mode,
      FLYNN_PARALLEL_THRESHOLD: responses.threshold,
    });

    console.log(chalk.blue(
      `\nConfiguration complete. You can override these defaults by setting the ` +
      `FLYNN_PARALLEL_MODE and FLYNN_PARALLEL_THRESHOLD environment variables.\n`,
    ));
  });
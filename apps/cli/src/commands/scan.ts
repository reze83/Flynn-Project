/**
 * Scan Command
 *
 * Scans a given JavaScript or TypeScript file for the usage of dangerous
 * functions such as eval or child_process.exec. If no file is provided
 * via command-line argument, an interactive prompt asks for the path.
 * The validator comes from the core policy module【430188905619224†L703-L713】.
 */

import { readFileSync } from "node:fs";
import { validateFunctionUsage } from "@flynn/core";
import chalk from "chalk";
import { Command } from "commander";
import prompts from "prompts";

export const scanCommand = new Command("scan")
  .description("Scan a JS/TS file for dangerous function usage")
  .argument("[file]", "Path to the file to scan")
  .action(async (file?: string) => {
    let filePath = file;
    if (!filePath) {
      const response = await prompts({
        type: "text",
        name: "path",
        message: "Enter path to file to scan",
      });
      filePath = response.path;
    }
    if (!filePath) {
      console.log(chalk.yellow("No file provided; aborting."));
      return;
    }
    try {
      const code = readFileSync(filePath, "utf8");
      const result = validateFunctionUsage(code);
      if (result.allowed) {
        console.log(chalk.green(`No dangerous functions detected in ${filePath}`));
      } else {
        console.log(chalk.red(`Dangerous function detected in ${filePath}: ${result.reason}`));
      }
    } catch (err) {
      console.error(chalk.red(`Failed to read file ${filePath}: ${(err as Error).message}`));
    }
  });

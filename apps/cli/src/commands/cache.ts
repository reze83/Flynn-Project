/**
 * Cache Command
 *
 * Allows users to manage persistent caches under `.flynn_cache`. Currently
 * supports clearing all cached data (embeddings, RAG results, project analysis).
 */

import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { Command } from "commander";

export const cacheCommand = new Command("cache").description("Manage Flynn caches").addCommand(
  new Command("clear")
    .description("Clear all persistent caches (\u00a0.flynn_cache directory)")
    .action(() => {
      const cacheDir = join(process.cwd(), ".flynn_cache");
      if (existsSync(cacheDir)) {
        try {
          rmSync(cacheDir, { recursive: true, force: true });
          console.log(chalk.green(`✔ Cleared cache at ${cacheDir}`));
        } catch (err) {
          console.error(
            chalk.red(`Failed to clear cache at ${cacheDir}: ${(err as Error).message}`),
          );
        }
      } else {
        console.log(chalk.gray(`No cache directory found at ${cacheDir}`));
      }
    }),
);

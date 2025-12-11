/**
 * Anthropic TypeScript SDK installer (for agent development)
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { createLogger } from "@flynn/core";
import { runCommand } from "./idempotent.js";
import type { InstallResult, Installer, InstallerOptions } from "./types.js";

const logger = createLogger("installer:sdk-ts");

export const sdkTypescriptInstaller: Installer = {
  name: "sdk-typescript",

  async check(): Promise<boolean> {
    // Check if package exists in node_modules
    const cwd = process.cwd();
    return existsSync(join(cwd, "node_modules", "@anthropic-ai", "sdk"));
  },

  async install(options?: InstallerOptions): Promise<InstallResult> {
    if (!options?.force && (await this.check())) {
      logger.info("Anthropic SDK (TypeScript) already installed in project");
      return {
        component: "sdk-typescript",
        status: "already-installed",
        message: "Already in node_modules",
      };
    }

    logger.info("Installing Anthropic TypeScript SDK...");

    // Prefer pnpm, fallback to npm
    const packageManager = existsSync("pnpm-lock.yaml") ? "pnpm" : "npm";
    const result = runCommand(`${packageManager} add @anthropic-ai/sdk`);

    if (result.success) {
      return {
        component: "sdk-typescript",
        status: "installed",
        message: `Installed via ${packageManager}`,
      };
    }

    return {
      component: "sdk-typescript",
      status: "failed",
      error: result.error,
    };
  },
};

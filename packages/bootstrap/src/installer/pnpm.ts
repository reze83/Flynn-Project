/**
 * pnpm installer
 */

import { createLogger } from "@flynn/core";
import { commandExists, getCommandVersion, runCommand } from "./idempotent.js";
import type { InstallResult, Installer, InstallerOptions } from "./types.js";

const logger = createLogger("installer:pnpm");

export const pnpmInstaller: Installer = {
  name: "pnpm",

  async check(): Promise<boolean> {
    return commandExists("pnpm");
  },

  async install(options?: InstallerOptions): Promise<InstallResult> {
    if (!options?.force && (await this.check())) {
      const version = getCommandVersion("pnpm");
      logger.info({ version }, "pnpm already installed");
      return {
        component: "pnpm",
        status: "already-installed",
        version: version || undefined,
      };
    }

    logger.info("Installing pnpm via corepack...");

    // Try corepack first (comes with Node.js)
    if (commandExists("corepack")) {
      const result = runCommand("corepack enable pnpm");
      if (result.success) {
        const version = getCommandVersion("pnpm");
        return {
          component: "pnpm",
          status: "installed",
          version: version || undefined,
          message: "Installed via corepack",
        };
      }
    }

    // Fallback to npm
    logger.info("Trying npm install...");
    const npmResult = runCommand("npm install -g pnpm");
    if (npmResult.success) {
      const version = getCommandVersion("pnpm");
      return {
        component: "pnpm",
        status: "installed",
        version: version || undefined,
        message: "Installed via npm",
      };
    }

    return {
      component: "pnpm",
      status: "failed",
      error: npmResult.error,
    };
  },
};

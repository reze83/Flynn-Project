/**
 * Claude Code CLI installer
 */

import { createLogger } from "@flynn/core";
import { commandExists, getCommandVersion, runCommand } from "./idempotent.js";
import type { InstallResult, Installer, InstallerOptions } from "./types.js";

const logger = createLogger("installer:claude-code");

export const claudeCodeInstaller: Installer = {
  name: "claude-code",

  async check(): Promise<boolean> {
    return commandExists("claude");
  },

  async install(options?: InstallerOptions): Promise<InstallResult> {
    if (!options?.force && (await this.check())) {
      const version = getCommandVersion("claude");
      logger.info({ version }, "Claude Code already installed");
      return {
        component: "claude-code",
        status: "already-installed",
        version: version || undefined,
      };
    }

    logger.info("Installing Claude Code CLI...");

    // Install via npm (official method)
    const result = runCommand("npm install -g @anthropic-ai/claude-code");

    if (result.success) {
      const version = getCommandVersion("claude");
      return {
        component: "claude-code",
        status: "installed",
        version: version || undefined,
        message: "Installed via npm",
      };
    }

    return {
      component: "claude-code",
      status: "failed",
      error: result.error,
    };
  },
};

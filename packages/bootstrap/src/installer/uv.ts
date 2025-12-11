/**
 * uv (Python package manager) installer
 */

import { homedir } from "node:os";
import { join } from "node:path";
import { createLogger } from "@flynn/core";
import { commandExists, getCommandVersion, runCommand } from "./idempotent.js";
import type { InstallResult, Installer, InstallerOptions } from "./types.js";

const logger = createLogger("installer:uv");

export const uvInstaller: Installer = {
  name: "uv",

  async check(): Promise<boolean> {
    return commandExists("uv");
  },

  async install(options?: InstallerOptions): Promise<InstallResult> {
    if (!options?.force && (await this.check())) {
      const version = getCommandVersion("uv");
      logger.info({ version }, "uv already installed");
      return {
        component: "uv",
        status: "already-installed",
        version: version || undefined,
      };
    }

    logger.info("Installing uv...");

    // Install via curl (official method)
    const result = runCommand("curl -LsSf https://astral.sh/uv/install.sh | sh", {
      shell: "/bin/bash",
    });

    if (result.success) {
      // Source the shell profile to get uv in PATH
      // Note: uv installs to ~/.local/bin or ~/.cargo/bin depending on method
      const uvPath = join(homedir(), ".local", "bin", "uv");
      const cargoPath = join(homedir(), ".cargo", "bin", "uv");
      const version =
        getCommandVersion("uv") || getCommandVersion(uvPath) || getCommandVersion(cargoPath);
      return {
        component: "uv",
        status: "installed",
        version: version || undefined,
        message: "Installed via astral.sh script",
      };
    }

    // Fallback: try pip
    logger.info("Trying pip install...");
    const pipResult = runCommand("pip install uv");
    if (pipResult.success) {
      const version = getCommandVersion("uv");
      return {
        component: "uv",
        status: "installed",
        version: version || undefined,
        message: "Installed via pip",
      };
    }

    return {
      component: "uv",
      status: "failed",
      error: result.error || pipResult.error,
    };
  },
};

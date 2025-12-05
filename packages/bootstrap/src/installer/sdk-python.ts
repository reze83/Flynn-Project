/**
 * Anthropic Python SDK installer
 */

import { createLogger } from "@flynn/core";
import { commandExists, runCommand } from "./idempotent.js";
import type { InstallResult, Installer, InstallerOptions } from "./types.js";

const logger = createLogger("installer:sdk-python");

export const sdkPythonInstaller: Installer = {
  name: "sdk-python",

  async check(): Promise<boolean> {
    // Check if anthropic package is installed
    const result = runCommand('python3 -c "import anthropic; print(anthropic.__version__)"');
    return result.success;
  },

  async install(options?: InstallerOptions): Promise<InstallResult> {
    if (!options?.force && (await this.check())) {
      const versionResult = runCommand(
        'python3 -c "import anthropic; print(anthropic.__version__)"',
      );
      logger.info({ version: versionResult.output }, "Anthropic SDK (Python) already installed");
      return {
        component: "sdk-python",
        status: "already-installed",
        version: versionResult.output || undefined,
      };
    }

    logger.info("Installing Anthropic Python SDK...");

    // Prefer uv, fallback to pip
    const useUv = commandExists("uv");
    const command = useUv ? "uv pip install anthropic" : "pip install anthropic";
    const result = runCommand(command);

    if (result.success) {
      const versionResult = runCommand(
        'python3 -c "import anthropic; print(anthropic.__version__)"',
      );
      return {
        component: "sdk-python",
        status: "installed",
        version: versionResult.output || undefined,
        message: `Installed via ${useUv ? "uv" : "pip"}`,
      };
    }

    return {
      component: "sdk-python",
      status: "failed",
      error: result.error,
    };
  },
};

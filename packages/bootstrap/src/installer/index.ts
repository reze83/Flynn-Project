/**
 * Installer module - aggregates all installers
 */

import { createLogger } from "@flynn/core";
import { claudeCodeInstaller } from "./claude-code.js";
import { pnpmInstaller } from "./pnpm.js";
import { sdkPythonInstaller } from "./sdk-python.js";
import { sdkTypescriptInstaller } from "./sdk-typescript.js";
import type { InstallResult, Installer, InstallerOptions } from "./types.js";
import { uvInstaller } from "./uv.js";

export * from "./types.js";
export * from "./idempotent.js";
export * from "./pnpm.js";
export * from "./uv.js";
export * from "./claude-code.js";
export * from "./sdk-typescript.js";
export * from "./sdk-python.js";

const logger = createLogger("installer");

/**
 * All available installers in recommended order
 */
export const installers: Installer[] = [
  pnpmInstaller,
  uvInstaller,
  claudeCodeInstaller,
  sdkTypescriptInstaller,
  sdkPythonInstaller,
];

/**
 * Run all installers
 */
export async function runInstallers(options?: InstallerOptions): Promise<InstallResult[]> {
  const results: InstallResult[] = [];

  logger.info("Starting installation process...");

  for (const installer of installers) {
    logger.info({ installer: installer.name }, "Running installer");
    try {
      const result = await installer.install(options);
      results.push(result);
      logger.info({ installer: installer.name, status: result.status }, "Installer completed");
    } catch (error) {
      const err = error as Error;
      results.push({
        component: installer.name,
        status: "failed",
        error: err.message,
      });
      logger.error({ installer: installer.name, error: err.message }, "Installer failed");
    }
  }

  return results;
}

/**
 * Run specific installers by name
 */
export async function runSpecificInstallers(
  names: string[],
  options?: InstallerOptions,
): Promise<InstallResult[]> {
  const results: InstallResult[] = [];

  for (const name of names) {
    const installer = installers.find((i) => i.name === name);
    if (!installer) {
      results.push({
        component: name,
        status: "failed",
        error: `Unknown installer: ${name}`,
      });
      continue;
    }

    try {
      const result = await installer.install(options);
      results.push(result);
    } catch (error) {
      const err = error as Error;
      results.push({
        component: name,
        status: "failed",
        error: err.message,
      });
    }
  }

  return results;
}

/**
 * Print installation results
 */
export function printInstallResults(results: InstallResult[]): void {
  const statusIcon = (status: InstallResult["status"]) => {
    switch (status) {
      case "installed":
        return "✓";
      case "already-installed":
        return "○";
      case "skipped":
        return "–";
      case "failed":
        return "✗";
    }
  };

  console.log("\n=== Installation Results ===\n");

  for (const result of results) {
    const icon = statusIcon(result.status);
    const version = result.version ? ` (${result.version})` : "";
    const message = result.message ? ` - ${result.message}` : "";
    const error = result.error ? ` - Error: ${result.error}` : "";

    console.log(`  ${icon} ${result.component}${version}${message}${error}`);
  }

  const failed = results.filter((r) => r.status === "failed");
  const installed = results.filter((r) => r.status === "installed");

  console.log("");
  if (failed.length > 0) {
    console.log(`  ${failed.length} failed, ${installed.length} installed`);
  } else {
    console.log(`  All ${results.length} components ready`);
  }
  console.log("");
}

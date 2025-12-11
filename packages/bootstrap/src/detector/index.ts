/**
 * Environment detection module - aggregates all detectors
 */

import { arch, platform, release } from "node:os";
import { detectClaudeCode } from "./claude-code.js";
import { detectGit } from "./git.js";
import { detectNode } from "./node.js";
import { detectPackageManagers } from "./package-managers.js";
import { detectPython } from "./python.js";
import type { EnvironmentInfo } from "./types.js";
import { detectEditors } from "./vscode.js";
import { detectWSL } from "./wsl.js";

export * from "./types.js";
export * from "./wsl.js";
export * from "./node.js";
export * from "./python.js";
export * from "./git.js";
export * from "./package-managers.js";
export * from "./vscode.js";
export * from "./claude-code.js";

/**
 * Detect full environment information
 */
export async function detectEnvironment(): Promise<EnvironmentInfo> {
  const wsl = detectWSL();
  const node = detectNode();
  const python = detectPython();
  const git = detectGit();
  const packageManagers = detectPackageManagers();
  const editors = detectEditors();
  const claudeCode = detectClaudeCode();

  return {
    os: {
      platform: platform(),
      arch: arch(),
      release: release(),
      isWSL: wsl.isWSL,
      isWSL2: wsl.isWSL2,
    },
    node: {
      installed: node.data?.installed ?? false,
      version: node.data?.version ?? null,
      path: node.data?.path ?? null,
      meetsMinimum: node.data?.meetsMinimum ?? false,
    },
    python: {
      installed: python.data?.installed ?? false,
      version: python.data?.version ?? null,
      path: python.data?.path ?? null,
      meetsMinimum: python.data?.meetsMinimum ?? false,
    },
    git: {
      installed: git.data?.installed ?? false,
      version: git.data?.version ?? null,
      path: git.data?.path ?? null,
    },
    packageManagers: {
      pnpm: packageManagers.pnpm,
      uv: packageManagers.uv,
      npm: packageManagers.npm,
    },
    editors: {
      vscode: editors.vscode,
      cursor: editors.cursor,
    },
    claudeCode: {
      installed: claudeCode.installed,
      version: claudeCode.version,
      configPath: claudeCode.configPath,
    },
  };
}

/**
 * Print environment summary to console
 */
export function printEnvironmentSummary(env: EnvironmentInfo): void {
  const check = (ok: boolean) => (ok ? "✓" : "✗");

  console.log("\n=== Flynn Environment Detection ===\n");

  console.log("Operating System:");
  console.log(`  Platform: ${env.os.platform} (${env.os.arch})`);
  console.log(`  WSL: ${env.os.isWSL ? (env.os.isWSL2 ? "WSL2" : "WSL1") : "No"}`);

  console.log("\nRuntimes:");
  console.log(
    `  ${check(env.node.meetsMinimum)} Node.js: ${env.node.version || "not installed"} ${env.node.meetsMinimum ? "" : "(need >=20)"}`,
  );
  console.log(
    `  ${check(env.python.meetsMinimum)} Python: ${env.python.version || "not installed"} ${env.python.meetsMinimum ? "" : "(need >=3.11)"}`,
  );
  console.log(`  ${check(env.git.installed)} Git: ${env.git.version || "not installed"}`);

  console.log("\nPackage Managers:");
  console.log(
    `  ${check(env.packageManagers.pnpm.installed)} pnpm: ${env.packageManagers.pnpm.version || "not installed"}`,
  );
  console.log(
    `  ${check(env.packageManagers.uv.installed)} uv: ${env.packageManagers.uv.version || "not installed"}`,
  );

  console.log("\nTools:");
  console.log(
    `  ${check(env.claudeCode.installed)} Claude Code: ${env.claudeCode.version || "not installed"}`,
  );
  console.log(
    `  ${check(env.editors.vscode.installed)} VS Code: ${env.editors.vscode.installed ? "installed" : "not installed"}`,
  );

  console.log("");
}

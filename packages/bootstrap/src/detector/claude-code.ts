/**
 * Claude Code CLI detection
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface ClaudeCodeInfo {
  installed: boolean;
  version: string | null;
  configPath: string | null;
  hasConfig: boolean;
}

export function detectClaudeCode(): ClaudeCodeInfo {
  // Check for config directory
  const configHome = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
  const claudeConfigPath = join(configHome, "claude");
  const hasConfig = existsSync(claudeConfigPath);

  try {
    // Try to run claude command
    const versionOutput = execSync("claude --version", {
      encoding: "utf-8",
      timeout: 5000,
    }).trim();

    return {
      installed: true,
      version: versionOutput,
      configPath: hasConfig ? claudeConfigPath : null,
      hasConfig,
    };
  } catch {
    return {
      installed: false,
      version: null,
      configPath: hasConfig ? claudeConfigPath : null,
      hasConfig,
    };
  }
}

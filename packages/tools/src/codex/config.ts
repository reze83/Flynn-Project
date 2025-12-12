/**
 * Codex Configuration
 *
 * Handles configuration loading, path detection, and default settings.
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import * as toml from "@iarna/toml";
import type { CodexConfig, CodexPaths } from "./types.js";

/**
 * Get default paths with XDG compliance
 */
export function getDefaultPaths(): CodexPaths {
  const home = homedir();
  const xdgRuntime = process.env.XDG_RUNTIME_DIR;

  return {
    codexPath: undefined, // Will be auto-detected
    configPath: join(home, ".codex", "config.toml"),
    outputDir: xdgRuntime ? join(xdgRuntime, "flynn-codex") : join(tmpdir(), "flynn-codex"),
    sessionDir: join(home, ".flynn", "codex-sessions"),
    handoffPath: ".ai-handoff.json",
  };
}

/**
 * Auto-detect Codex CLI path
 */
export function detectCodexPath(): string | undefined {
  try {
    const result = execSync("which codex", { encoding: "utf-8" }).trim();
    return result || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Read and parse Codex config.toml
 */
export function readCodexConfig(configPath: string): CodexConfig | undefined {
  try {
    if (!existsSync(configPath)) {
      return undefined;
    }
    const content = readFileSync(configPath, "utf-8");
    return toml.parse(content) as CodexConfig;
  } catch {
    return undefined;
  }
}

/**
 * Log file paths for a session
 */
export function getSessionLogPaths(
  sessionDir: string,
  sessionId: string,
): { outputLog: string; statusFile: string } {
  return {
    outputLog: join(sessionDir, `${sessionId}.log`),
    statusFile: join(sessionDir, `${sessionId}.status`),
  };
}

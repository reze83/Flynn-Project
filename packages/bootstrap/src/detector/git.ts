/**
 * Git detection
 */

import { execSync } from "node:child_process";
import type { DetectorResult } from "./types.js";

export interface GitInfo {
  installed: boolean;
  version: string | null;
  path: string | null;
}

export function detectGit(): DetectorResult<GitInfo> {
  try {
    const versionOutput = execSync("git --version", {
      encoding: "utf-8",
      timeout: 5000,
    }).trim();

    const pathOutput = execSync("which git", {
      encoding: "utf-8",
      timeout: 5000,
    }).trim();

    // Parse version (e.g., "git version 2.43.0" -> "2.43.0")
    const versionMatch = versionOutput.match(/git version\s+([\d.]+)/);
    const version = versionMatch?.[1] ?? versionOutput;

    return {
      success: true,
      data: {
        installed: true,
        version,
        path: pathOutput,
      },
    };
  } catch {
    return {
      success: true,
      data: {
        installed: false,
        version: null,
        path: null,
      },
    };
  }
}

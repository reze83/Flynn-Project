/**
 * Python detection
 */

import { execSync } from "node:child_process";
import { MIN_PYTHON_VERSION, type DetectorResult } from "./types.js";

export interface PythonInfo {
  installed: boolean;
  version: string | null;
  path: string | null;
  meetsMinimum: boolean;
  command: "python3" | "python" | null;
}

function parseVersion(version: string): [number, number] | null {
  const match = version.match(/(\d+)\.(\d+)/);
  if (!match) return null;
  return [parseInt(match[1], 10), parseInt(match[2], 10)];
}

function meetsMinimum(version: string | null): boolean {
  if (!version) return false;
  const parsed = parseVersion(version);
  const min = parseVersion(MIN_PYTHON_VERSION);
  if (!parsed || !min) return false;
  return parsed[0] > min[0] || (parsed[0] === min[0] && parsed[1] >= min[1]);
}

export function detectPython(): DetectorResult<PythonInfo> {
  // Try python3 first, then python
  const commands = ["python3", "python"] as const;

  for (const cmd of commands) {
    try {
      const versionOutput = execSync(`${cmd} --version`, {
        encoding: "utf-8",
        timeout: 5000,
      }).trim();

      const pathOutput = execSync(`which ${cmd}`, {
        encoding: "utf-8",
        timeout: 5000,
      }).trim();

      // Parse version (e.g., "Python 3.11.5" -> "3.11.5")
      const versionMatch = versionOutput.match(/Python\s+([\d.]+)/);
      const version = versionMatch ? versionMatch[1] : null;

      return {
        success: true,
        data: {
          installed: true,
          version,
          path: pathOutput,
          meetsMinimum: meetsMinimum(version),
          command: cmd,
        },
      };
    } catch {
      // Try next command
    }
  }

  return {
    success: true,
    data: {
      installed: false,
      version: null,
      path: null,
      meetsMinimum: false,
      command: null,
    },
  };
}

/**
 * VS Code and Cursor detection
 */

import { execSync } from "node:child_process";

export interface EditorInfo {
  installed: boolean;
  path: string | null;
  version: string | null;
}

export interface EditorsInfo {
  vscode: EditorInfo;
  cursor: EditorInfo;
}

function detectEditor(command: string): EditorInfo {
  try {
    const pathOutput = execSync(`which ${command}`, {
      encoding: "utf-8",
      timeout: 5000,
    }).trim();

    let version: string | null = null;
    try {
      const versionOutput = execSync(`${command} --version`, {
        encoding: "utf-8",
        timeout: 5000,
      }).trim();
      // First line usually contains version
      version = versionOutput.split("\n")[0] ?? null;
    } catch {
      // Version check failed but command exists
    }

    return { installed: true, path: pathOutput, version };
  } catch {
    return { installed: false, path: null, version: null };
  }
}

export function detectEditors(): EditorsInfo {
  return {
    vscode: detectEditor("code"),
    cursor: detectEditor("cursor"),
  };
}

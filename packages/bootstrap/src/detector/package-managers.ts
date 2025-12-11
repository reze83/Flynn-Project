/**
 * Package manager detection (pnpm, uv, npm)
 */

import { execSync } from "node:child_process";

export interface PackageManagerInfo {
  installed: boolean;
  version: string | null;
}

export interface PackageManagersInfo {
  pnpm: PackageManagerInfo;
  uv: PackageManagerInfo;
  npm: PackageManagerInfo;
}

function detectCommand(command: string, versionFlag = "--version"): PackageManagerInfo {
  try {
    const output = execSync(`${command} ${versionFlag}`, {
      encoding: "utf-8",
      timeout: 5000,
    }).trim();

    // Extract version number
    const versionMatch = output.match(/(\d+\.\d+\.\d+)/);
    const version = versionMatch?.[1] ?? output.split("\n")[0] ?? output;

    return { installed: true, version };
  } catch {
    return { installed: false, version: null };
  }
}

export function detectPackageManagers(): PackageManagersInfo {
  return {
    pnpm: detectCommand("pnpm"),
    uv: detectCommand("uv"),
    npm: detectCommand("npm"),
  };
}

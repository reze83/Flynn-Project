/**
 * WSL/WSL2 detection
 */

import { existsSync, readFileSync } from "node:fs";
import { release } from "node:os";

export interface WSLInfo {
  isWSL: boolean;
  isWSL2: boolean;
  distro: string | null;
}

export function detectWSL(): WSLInfo {
  const rel = release().toLowerCase();
  const isWSL = rel.includes("wsl") || rel.includes("microsoft");

  if (!isWSL) {
    return { isWSL: false, isWSL2: false, distro: null };
  }

  // WSL2 has "wsl2" in release or uses Hyper-V
  const isWSL2 = rel.includes("wsl2") || existsSync("/run/WSL");

  // Try to get distro name
  let distro: string | null = null;
  try {
    if (existsSync("/etc/os-release")) {
      const osRelease = readFileSync("/etc/os-release", "utf-8");
      const match = osRelease.match(/^ID=(.+)$/m);
      if (match?.[1]) {
        distro = match[1].replace(/"/g, "");
      }
    }
  } catch {
    // Ignore errors
  }

  return { isWSL, isWSL2, distro };
}

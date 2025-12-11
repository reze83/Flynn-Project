/**
 * Node.js detection
 */

import { execSync } from "node:child_process";
import { type DetectorResult, MIN_NODE_VERSION } from "./types.js";

export interface NodeInfo {
  installed: boolean;
  version: string | null;
  path: string | null;
  meetsMinimum: boolean;
  majorVersion: number | null;
}

export function detectNode(): DetectorResult<NodeInfo> {
  try {
    // Get Node.js version
    const versionOutput = execSync("node --version", {
      encoding: "utf-8",
      timeout: 5000,
    }).trim();

    // Get Node.js path
    const pathOutput = execSync("which node", {
      encoding: "utf-8",
      timeout: 5000,
    }).trim();

    // Parse version (e.g., "v20.10.0" -> 20)
    const versionMatch = versionOutput.match(/^v(\d+)/);
    const majorVersion = versionMatch?.[1] ? Number.parseInt(versionMatch[1], 10) : null;
    const meetsMinimum = majorVersion !== null && majorVersion >= MIN_NODE_VERSION;

    return {
      success: true,
      data: {
        installed: true,
        version: versionOutput,
        path: pathOutput,
        meetsMinimum,
        majorVersion,
      },
    };
  } catch (error) {
    return {
      success: true,
      data: {
        installed: false,
        version: null,
        path: null,
        meetsMinimum: false,
        majorVersion: null,
      },
    };
  }
}

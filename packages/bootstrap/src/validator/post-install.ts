/**
 * Post-installation validators
 */

import { commandExists, getCommandVersion, meetsMinimumVersion } from "../installer/idempotent.js";
import type { ValidationResult, Validator } from "./types.js";

export const nodeValidator: Validator = {
  name: "node",
  async validate(): Promise<ValidationResult> {
    if (!commandExists("node")) {
      return { component: "node", valid: false, message: "Node.js not installed" };
    }
    const version = getCommandVersion("node");
    if (!version || !meetsMinimumVersion(version, "20.0.0")) {
      return {
        component: "node",
        valid: false,
        message: `Node.js version ${version} does not meet minimum (20.0.0)`,
      };
    }
    return { component: "node", valid: true, message: `Node.js ${version}` };
  },
};

export const pnpmValidator: Validator = {
  name: "pnpm",
  async validate(): Promise<ValidationResult> {
    if (!commandExists("pnpm")) {
      return { component: "pnpm", valid: false, message: "pnpm not installed" };
    }
    const version = getCommandVersion("pnpm");
    return { component: "pnpm", valid: true, message: `pnpm ${version}` };
  },
};

export const pythonValidator: Validator = {
  name: "python",
  async validate(): Promise<ValidationResult> {
    const cmd = commandExists("python3") ? "python3" : commandExists("python") ? "python" : null;
    if (!cmd) {
      return { component: "python", valid: false, message: "Python not installed" };
    }
    const version = getCommandVersion(cmd);
    if (!version || !meetsMinimumVersion(version, "3.11.0")) {
      return {
        component: "python",
        valid: false,
        message: `Python version ${version} does not meet minimum (3.11)`,
      };
    }
    return { component: "python", valid: true, message: `Python ${version}` };
  },
};

export const uvValidator: Validator = {
  name: "uv",
  async validate(): Promise<ValidationResult> {
    if (!commandExists("uv")) {
      return { component: "uv", valid: false, message: "uv not installed" };
    }
    const version = getCommandVersion("uv");
    return { component: "uv", valid: true, message: `uv ${version}` };
  },
};

export const gitValidator: Validator = {
  name: "git",
  async validate(): Promise<ValidationResult> {
    if (!commandExists("git")) {
      return { component: "git", valid: false, message: "Git not installed" };
    }
    const version = getCommandVersion("git");
    return { component: "git", valid: true, message: `Git ${version}` };
  },
};

export const claudeCodeValidator: Validator = {
  name: "claude-code",
  async validate(): Promise<ValidationResult> {
    if (!commandExists("claude")) {
      return { component: "claude-code", valid: false, message: "Claude Code not installed" };
    }
    const version = getCommandVersion("claude");
    return { component: "claude-code", valid: true, message: `Claude Code ${version}` };
  },
};

export const postInstallValidators: Validator[] = [
  nodeValidator,
  pnpmValidator,
  pythonValidator,
  uvValidator,
  gitValidator,
  claudeCodeValidator,
];

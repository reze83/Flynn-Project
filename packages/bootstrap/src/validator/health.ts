/**
 * Runtime health checks
 */

import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { getConfigDir, getDataDir } from "@flynn/core";
import type { ValidationResult, Validator } from "./types.js";

export const dataDirValidator: Validator = {
  name: "data-dir",
  async validate(): Promise<ValidationResult> {
    const dataDir = getDataDir();
    if (!existsSync(dataDir)) {
      return {
        component: "data-dir",
        valid: false,
        message: `Data directory does not exist: ${dataDir}`,
        details: `Run 'mkdir -p ${dataDir}' to create it`,
      };
    }
    return { component: "data-dir", valid: true, message: `Data directory: ${dataDir}` };
  },
};

export const configDirValidator: Validator = {
  name: "config-dir",
  async validate(): Promise<ValidationResult> {
    const configDir = getConfigDir();
    if (!existsSync(configDir)) {
      return {
        component: "config-dir",
        valid: false,
        message: `Config directory does not exist: ${configDir}`,
        details: `Run 'mkdir -p ${configDir}' to create it`,
      };
    }
    return { component: "config-dir", valid: true, message: `Config directory: ${configDir}` };
  },
};

export const claudeConfigValidator: Validator = {
  name: "claude-config",
  async validate(): Promise<ValidationResult> {
    const configHome = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
    const claudeConfig = join(configHome, "claude");

    if (!existsSync(claudeConfig)) {
      return {
        component: "claude-config",
        valid: false,
        message: "Claude Code config directory not found",
        details: `Expected at: ${claudeConfig}`,
      };
    }
    return { component: "claude-config", valid: true, message: `Claude config: ${claudeConfig}` };
  },
};

export const anthropicKeyValidator: Validator = {
  name: "anthropic-key",
  async validate(): Promise<ValidationResult> {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      return {
        component: "anthropic-key",
        valid: false,
        message: "ANTHROPIC_API_KEY not set",
        details: "Set ANTHROPIC_API_KEY environment variable for agent functionality",
      };
    }
    // Don't log the actual key, just check format
    const isValidFormat = key.startsWith("sk-ant-");
    return {
      component: "anthropic-key",
      valid: isValidFormat,
      message: isValidFormat ? "ANTHROPIC_API_KEY is set" : "ANTHROPIC_API_KEY has invalid format",
    };
  },
};

export const healthValidators: Validator[] = [
  dataDirValidator,
  configDirValidator,
  claudeConfigValidator,
  anthropicKeyValidator,
];

/**
 * Shared TypeScript types for Flynn
 */

export interface FlynnConfig {
  logLevel: "debug" | "info" | "warn" | "error";
  dataDir: string;
  configDir: string;
}

export interface AgentCapability {
  description: string;
  triggers: string[];
  tools: string[];
}

export interface PolicyPermissions {
  shell: {
    allow: string[];
    deny: string[];
  };
  paths: {
    writable: string[];
    readonly: string[];
  };
  agents: {
    max_iterations: number;
    timeout_seconds: number;
  };
}

/**
 * Flynn Plugin System - Type Definitions
 *
 * Core interfaces for the Flynn plugin architecture.
 */

import { z } from "zod";

// ============================================================================
// Agent Definition (from @flynn/tools)
// ============================================================================

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  instructions: string;
  tools: string[];
  workflow: string[];
  constraints: string[];
  outputFormat: string;
  triggers: string[];
  tier1TokenEstimate?: number;
  tier2TokenEstimate?: number;
  recommendedModel?: "haiku" | "sonnet" | "opus";
  modelRationale?: string;
}

// ============================================================================
// Skill Definition (from @flynn/tools)
// ============================================================================

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  instructions: string;
  resources?: string[];
  triggers: string[];
}

// ============================================================================
// Workflow Definition
// ============================================================================

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  agents: string[];
  triggers: string[];
  parallel?: boolean;
}

// ============================================================================
// Hook Definition
// ============================================================================

export interface HookDefinition {
  event:
    | "PreToolUse"
    | "PostToolUse"
    | "SessionStart"
    | "Stop"
    | "UserPromptSubmit"
    | "Notification";
  type: "command" | "block";
  command?: string;
  pattern?: string;
  description: string;
}

// ============================================================================
// Plugin Manifest (plugin.json)
// ============================================================================

export const PluginManifestSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Plugin ID must be lowercase alphanumeric with hyphens"),
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+/, "Version must be semver"),
  description: z.string().optional(),
  author: z.string().optional(),
  license: z.string().optional(),
  main: z.string().default("./dist/index.js"),
  flynn: z.object({
    minVersion: z.string().default("1.0.0"),
    agents: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    workflows: z.array(z.string()).optional(),
    hooks: z.array(z.string()).optional(),
  }),
  dependencies: z.record(z.string(), z.string()).optional(),
  devDependencies: z.record(z.string(), z.string()).optional(),
});

export type PluginManifest = z.infer<typeof PluginManifestSchema>;

// ============================================================================
// Plugin Context (passed to plugin.initialize)
// ============================================================================

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export interface PluginContext {
  /** Register a new agent */
  registerAgent(agent: AgentDefinition): void;

  /** Register a new skill */
  registerSkill(skill: SkillDefinition): void;

  /** Register a new workflow */
  registerWorkflow(workflow: WorkflowDefinition): void;

  /** Register a new hook */
  registerHook(hook: HookDefinition): void;

  /** Get plugin configuration */
  getConfig<T = unknown>(key: string): T | undefined;

  /** Set plugin configuration */
  setConfig<T = unknown>(key: string, value: T): void;

  /** Plugin logger */
  log: Logger;

  /** Flynn version */
  flynnVersion: string;

  /** Plugin's data directory */
  dataDir: string;
}

// ============================================================================
// Flynn Plugin Interface
// ============================================================================

export interface FlynnPlugin {
  /** Unique plugin identifier */
  id: string;

  /** Display name */
  name: string;

  /** Plugin version */
  version: string;

  /** Short description */
  description?: string;

  /**
   * Initialize the plugin
   * Called when the plugin is loaded
   */
  initialize(context: PluginContext): Promise<void>;

  /**
   * Cleanup the plugin
   * Called when the plugin is unloaded
   */
  destroy?(): Promise<void>;

  /** Agent definitions provided by this plugin */
  agents?: AgentDefinition[];

  /** Skill definitions provided by this plugin */
  skills?: SkillDefinition[];

  /** Workflow definitions provided by this plugin */
  workflows?: WorkflowDefinition[];

  /** Hook definitions provided by this plugin */
  hooks?: HookDefinition[];
}

// ============================================================================
// Plugin Info (for listing)
// ============================================================================

export interface PluginInfo {
  id: string;
  name: string;
  version: string;
  description?: string;
  path: string;
  loaded: boolean;
  agents: string[];
  skills: string[];
  workflows: string[];
  hooks: number;
}

// ============================================================================
// Plugin Loader Options
// ============================================================================

export interface PluginLoaderOptions {
  /** Plugin search directories */
  searchDirs?: string[];

  /** Whether to load plugins automatically */
  autoLoad?: boolean;

  /** Flynn version for compatibility checks */
  flynnVersion?: string;
}

// ============================================================================
// Plugin Events
// ============================================================================

export type PluginEventType =
  | "plugin:loaded"
  | "plugin:unloaded"
  | "plugin:error"
  | "agent:registered"
  | "skill:registered"
  | "workflow:registered"
  | "hook:registered";

export interface PluginEvent {
  type: PluginEventType;
  pluginId: string;
  data?: unknown;
  timestamp: Date;
}

export type PluginEventHandler = (event: PluginEvent) => void;

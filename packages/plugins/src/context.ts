/**
 * Flynn Plugin System - Plugin Context
 *
 * Provides the context object passed to plugins during initialization.
 */

import { createLogger } from "@flynn/core";
import type {
  AgentDefinition,
  HookDefinition,
  Logger,
  PluginContext,
  SkillDefinition,
  WorkflowDefinition,
} from "./types.js";

/**
 * Create a logger for a plugin
 */
function createPluginLogger(pluginId: string): Logger {
  const pinoLogger = createLogger("plugins", { plugin: pluginId });

  return {
    debug: (message: string, ...args: unknown[]) => {
      pinoLogger.debug({ args: args.length > 0 ? args : undefined }, message);
    },
    info: (message: string, ...args: unknown[]) => {
      pinoLogger.info({ args: args.length > 0 ? args : undefined }, message);
    },
    warn: (message: string, ...args: unknown[]) => {
      pinoLogger.warn({ args: args.length > 0 ? args : undefined }, message);
    },
    error: (message: string, ...args: unknown[]) => {
      pinoLogger.error({ args: args.length > 0 ? args : undefined }, message);
    },
  };
}

/**
 * Registry for plugin-provided extensions
 */
export interface PluginRegistry {
  agents: Map<string, AgentDefinition>;
  skills: Map<string, SkillDefinition>;
  workflows: Map<string, WorkflowDefinition>;
  hooks: HookDefinition[];
}

/**
 * Create a new empty registry
 */
export function createRegistry(): PluginRegistry {
  return {
    agents: new Map(),
    skills: new Map(),
    workflows: new Map(),
    hooks: [],
  };
}

/**
 * Plugin context options
 */
export interface PluginContextOptions {
  pluginId: string;
  flynnVersion: string;
  dataDir: string;
  registry: PluginRegistry;
  config?: Map<string, unknown>;
}

/**
 * Create a plugin context for a specific plugin
 */
export function createPluginContext(options: PluginContextOptions): PluginContext {
  const { pluginId, flynnVersion, dataDir, registry, config = new Map() } = options;

  const log = createPluginLogger(pluginId);

  return {
    registerAgent(agent: AgentDefinition): void {
      const fullId = `${pluginId}:${agent.id}`;
      if (registry.agents.has(fullId)) {
        log.warn(`Agent ${fullId} already registered, overwriting`);
      }
      registry.agents.set(fullId, { ...agent, id: fullId });
      log.debug(`Registered agent: ${fullId}`);
    },

    registerSkill(skill: SkillDefinition): void {
      const fullId = `${pluginId}:${skill.id}`;
      if (registry.skills.has(fullId)) {
        log.warn(`Skill ${fullId} already registered, overwriting`);
      }
      registry.skills.set(fullId, { ...skill, id: fullId });
      log.debug(`Registered skill: ${fullId}`);
    },

    registerWorkflow(workflow: WorkflowDefinition): void {
      const fullId = `${pluginId}:${workflow.id}`;
      if (registry.workflows.has(fullId)) {
        log.warn(`Workflow ${fullId} already registered, overwriting`);
      }
      registry.workflows.set(fullId, { ...workflow, id: fullId });
      log.debug(`Registered workflow: ${fullId}`);
    },

    registerHook(hook: HookDefinition): void {
      registry.hooks.push(hook);
      log.debug(`Registered hook for event: ${hook.event}`);
    },

    getConfig<T = unknown>(key: string): T | undefined {
      return config.get(key) as T | undefined;
    },

    setConfig<T = unknown>(key: string, value: T): void {
      config.set(key, value);
    },

    log,
    flynnVersion,
    dataDir,
  };
}

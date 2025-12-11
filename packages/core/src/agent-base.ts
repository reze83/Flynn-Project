/**
 * Abstract Agent Base Class
 *
 * Base class providing common functionality for all Flynn agents.
 * Supports dynamic model selection via Factory Pattern.
 */

import { Agent, type AgentConfig, type ToolsetsInput } from "@mastra/core/agent";
import { createLogger } from "./logger.js";

/**
 * Model tiers for dynamic selection
 */
export type ModelTier = "opus" | "sonnet" | "haiku";

/**
 * Model IDs for each tier (Mastra Model Router format)
 */
export const MODEL_IDS: Record<ModelTier, string> = {
  opus: "anthropic/claude-opus-4-5-20251101",
  sonnet: "anthropic/claude-sonnet-4-20250514",
  haiku: "anthropic/claude-3-5-haiku-20241022",
};

/**
 * Default model tier for agents
 */
export const DEFAULT_TIER: ModelTier = "sonnet";

/**
 * Default model ID (for backwards compatibility)
 */
export const DEFAULT_MODEL = MODEL_IDS[DEFAULT_TIER];

/**
 * Get model for a specific tier (returns Mastra Model Router string)
 */
export function getModelForTier(tier: ModelTier): string {
  return MODEL_IDS[tier];
}

/**
 * Get model from environment or use default tier (returns Mastra Model Router string)
 */
export function getAgentModel(tier?: ModelTier): string {
  if (tier) {
    return getModelForTier(tier);
  }
  const envModel = process.env.FLYNN_AGENT_MODEL;
  if (envModel) {
    // Support both formats: "claude-sonnet-4" and "anthropic/claude-sonnet-4"
    return envModel.includes("/") ? envModel : `anthropic/${envModel}`;
  }
  return DEFAULT_MODEL;
}

/**
 * Flynn agent configuration
 */
export interface FlynnAgentConfig extends Omit<AgentConfig, "model"> {
  /** Agent ID (required) */
  id: string;
  /** Agent name for display */
  name: string;
  /** Agent description for routing */
  description: string;
  /** System instructions */
  instructions: string;
  /** Override default model (Mastra Model Router string, e.g., "anthropic/claude-sonnet-4") */
  model?: string;
}

/**
 * Create a Flynn agent with standard configuration
 *
 * @param config - Agent configuration
 * @param tier - Optional model tier override
 * @returns Configured Agent instance
 */
export function createFlynnAgent(config: FlynnAgentConfig, tier?: ModelTier): Agent {
  const logger = createLogger(`agent:${config.id}`);
  const model = config.model || getAgentModel(tier);

  logger.debug(
    { id: config.id, name: config.name, tier: tier || "default" },
    "Creating Flynn agent",
  );

  return new Agent({
    ...config,
    model,
  });
}

/**
 * Agent factory function type
 * Creates an agent with a specific model tier
 */
export type AgentFactory = (tier?: ModelTier) => Agent;

/**
 * Create an agent factory for dynamic model selection
 *
 * @param config - Base agent configuration (without model)
 * @returns Factory function that creates agents with specified tier
 *
 * @example
 * const createCoder = createAgentFactory({
 *   id: "flynn-coder",
 *   name: "Flynn Coder",
 *   description: "Writes code",
 *   instructions: coderInstructions,
 * });
 *
 * // Orchestrator can now choose model per request
 * const agent = createCoder("opus");  // Complex task
 * const agent = createCoder("haiku"); // Simple task
 * const agent = createCoder();        // Default (sonnet)
 */
export function createAgentFactory(config: Omit<FlynnAgentConfig, "model">): AgentFactory {
  return (tier?: ModelTier) => createFlynnAgent(config, tier);
}

/**
 * Agent execution options
 */
export interface ExecutionOptions {
  /** Resource ID for memory context */
  resourceId?: string;
  /** Thread ID for conversation */
  threadId?: string;
  /** Dynamic toolsets from MCP */
  toolsets?: ToolsetsInput;
}

/**
 * Execute an agent with standard options
 *
 * @param agent - Agent to execute
 * @param prompt - User prompt
 * @param options - Execution options
 */
export async function executeAgent(
  agent: Agent,
  prompt: string,
  options: ExecutionOptions = {},
): Promise<unknown> {
  const { resourceId = "default", threadId, toolsets } = options;

  return agent.generate(prompt, {
    resourceId,
    threadId,
    toolsets,
  });
}

/**
 * Stream agent response with standard options
 *
 * @param agent - Agent to execute
 * @param prompt - User prompt
 * @param options - Execution options
 */
export async function streamAgent(
  agent: Agent,
  prompt: string,
  options: ExecutionOptions = {},
): Promise<unknown> {
  const { resourceId = "default", threadId, toolsets } = options;

  return agent.stream(prompt, {
    resourceId,
    threadId,
    toolsets,
  });
}

export { Agent };

/**
 * Task Router Tool
 * Rule-based routing without LLM calls - no API key required
 * PERFORMANCE: Uses pre-built trigger index for O(1) lookups
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { AGENT_CONTEXTS } from "./agent-contexts.js";

const inputSchema = z.object({
  message: z.string().describe("The task description to route"),
});

const outputSchema = z.object({
  agent: z.string(),
  confidence: z.number(),
  reasoning: z.string(),
  capabilities: z.array(z.string()),
  suggestedAction: z.string(),
});

// Fallback to coder (guaranteed to exist)
// biome-ignore lint/style/noNonNullAssertion: AGENT_CONTEXTS.coder is always defined
const DEFAULT_AGENT = AGENT_CONTEXTS.coder!;

/**
 * PERFORMANCE: Pre-built trigger index for fast lookups
 * Maps each trigger word to the agents that use it
 */
interface TriggerEntry {
  agentId: string;
  weight: number; // Can be adjusted for priority
}

const triggerIndex: Map<string, TriggerEntry[]> = new Map();

// Build index once at module load time
function buildTriggerIndex(): void {
  for (const [agentId, context] of Object.entries(AGENT_CONTEXTS)) {
    for (const trigger of context.triggers) {
      const lowerTrigger = trigger.toLowerCase();
      const existing = triggerIndex.get(lowerTrigger) || [];
      existing.push({ agentId, weight: 1 });
      triggerIndex.set(lowerTrigger, existing);
    }
  }
}

// Initialize index
buildTriggerIndex();

/**
 * PERFORMANCE: Get all unique triggers for word boundary matching
 */
const allTriggers = Array.from(triggerIndex.keys()).sort((a, b) => b.length - a.length);

/**
 * Route a task to the appropriate agent using indexed lookup
 * PERFORMANCE: O(triggers) instead of O(agents * triggers)
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: routing logic requires multiple checks
function routeTask(message: string): {
  agent: string;
  confidence: number;
  reasoning: string;
  capabilities: string[];
  suggestedAction: string;
} {
  const lowerMessage = message.toLowerCase();
  const scores: Map<string, number> = new Map();
  const matchedTriggers: Map<string, string[]> = new Map();

  // PERFORMANCE: Single pass through triggers, check if each exists in message
  for (const trigger of allTriggers) {
    if (lowerMessage.includes(trigger)) {
      const entries = triggerIndex.get(trigger);
      if (entries) {
        for (const { agentId, weight } of entries) {
          scores.set(agentId, (scores.get(agentId) || 0) + weight);

          // Track matched triggers for reasoning
          const existing = matchedTriggers.get(agentId) || [];
          existing.push(trigger);
          matchedTriggers.set(agentId, existing);
        }
      }
    }
  }

  // Find the best matching agent
  let bestAgent = "coder";
  let bestScore = 0;

  for (const [agent, score] of scores) {
    if (score > bestScore) {
      bestScore = score;
      bestAgent = agent;
    }
  }

  const ctx = AGENT_CONTEXTS[bestAgent] || DEFAULT_AGENT;
  const confidence = Math.min(bestScore / 3, 1);

  const agentTriggers = matchedTriggers.get(bestAgent) || [];
  const reasoning =
    bestScore > 0
      ? `Matched keywords: ${agentTriggers.join(", ")}. ${ctx.description}.`
      : "No specific keywords matched. Defaulting to coder agent.";

  return {
    agent: bestAgent,
    confidence,
    reasoning,
    capabilities: ctx.capabilities,
    suggestedAction: `Use the ${bestAgent} agent to: ${ctx.description.toLowerCase()}`,
  };
}

export const taskRouterTool = createTool({
  id: "route-task",
  description:
    "Route a development task to the appropriate specialized agent (no API key required)",
  inputSchema,
  outputSchema,
  execute: async (inputData) => {
    const data = inputData as unknown as {
      context?: { message?: string };
      message?: string;
    };
    const message = data?.context?.message || data?.message || "";

    if (!message || typeof message !== "string" || message.trim() === "") {
      return {
        agent: "coder",
        confidence: 0,
        reasoning: "No valid message provided. Defaulting to coder agent.",
        capabilities: DEFAULT_AGENT.capabilities,
        suggestedAction: "Provide a task description to get accurate routing.",
      };
    }

    return routeTask(message);
  },
});

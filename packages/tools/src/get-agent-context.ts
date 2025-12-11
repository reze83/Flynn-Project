/**
 * Get Agent Context Tool
 *
 * Returns structured agent context for Claude Code to adopt.
 * No LLM calls - just returns the appropriate instructions.
 * Includes dynamic external MCP tool recommendations.
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { AGENT_CONTEXTS, getAgentContextWithConstraints } from "./agent-contexts.js";
import { type McpToolCategory, mcpRegistry } from "./mcp-registry.js";

/**
 * Agent to MCP category mapping
 * Maps agent IDs to relevant external MCP tool categories
 */
const AGENT_MCP_CATEGORIES: Record<string, McpToolCategory[]> = {
  // Core agents
  coder: ["code-analysis", "documentation"],
  diagnostic: ["code-analysis", "search", "thinking"], // Added thinking for complex debugging
  security: ["code-analysis", "search", "research"],
  reviewer: ["code-analysis", "thinking"], // Added thinking for thorough review
  performance: ["code-analysis", "thinking"], // Added thinking for analysis
  data: ["research", "search", "thinking"], // Added thinking for data analysis
  healer: ["search", "thinking"], // Added thinking for recovery planning

  // Architecture agents
  "system-architect": ["documentation", "research", "thinking"], // Added thinking for architecture decisions
  "database-architect": ["documentation", "research", "thinking"], // Added thinking for schema design
  "frontend-architect": ["documentation", "search"],
  "api-designer": ["documentation", "search", "thinking"], // Added thinking for API design

  // Operations agents
  "devops-engineer": ["documentation", "search"],
  "incident-responder": ["search", "research", "thinking"], // Added thinking for incident analysis

  // Domain agents
  "documentation-architect": ["documentation", "search", "research"],
  "ml-engineer": ["documentation", "research", "search", "thinking"], // Added thinking for ML decisions
  "test-architect": ["documentation", "code-analysis", "thinking"], // Added thinking for test strategy
  "migration-specialist": ["documentation", "search", "thinking"], // Added for migration planning
};

const inputSchema = z.object({
  task: z.string().describe("Task description to get context for"),
  agent: z.string().optional().describe("Specific agent ID (auto-detect if not provided)"),
  tier: z
    .number()
    .min(1)
    .max(2)
    .optional()
    .default(2)
    .describe("Loading tier: 1=metadata only (~100 tokens), 2=full context (default)"),
});

const outputSchema = z.object({
  agent: z.string(),
  confidence: z.number(),
  tier: z.number(),
  tokensUsed: z.number(),
  // Tier 1: Metadata only (for discovery)
  metadata: z
    .object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      triggers: z.array(z.string()),
      capabilities: z.array(z.string()),
      recommendedModel: z.enum(["haiku", "sonnet", "opus"]).optional(),
      modelRationale: z.string().optional(),
    })
    .optional(),
  // Tier 2: Full context (default, backward compatible)
  context: z
    .object({
      name: z.string(),
      description: z.string(),
      instructions: z.string(),
      tools: z.array(z.string()),
      workflow: z.array(z.string()),
      constraints: z.array(z.string()),
      outputFormat: z.string(),
    })
    .optional(),
  // External MCP tools recommendations (dynamic)
  externalTools: z
    .object({
      recommended: z.array(z.string()).describe("Recommended external MCP tool IDs"),
      categories: z.array(z.string()).describe("Relevant tool categories"),
      hint: z.string().optional().describe("Usage hint for external tools"),
    })
    .optional(),
});

/**
 * Get external tool recommendations for an agent
 */
function getExternalToolRecommendations(agentId: string): {
  recommended: string[];
  categories: string[];
  hint?: string;
} {
  const categories = AGENT_MCP_CATEGORIES[agentId] || [];
  const recommended: string[] = [];

  for (const category of categories) {
    const tools = mcpRegistry.getToolsByCategory(category);
    for (const tool of tools) {
      if (tool.server !== "flynn" && !recommended.includes(tool.id)) {
        recommended.push(tool.id);
      }
    }
  }

  // Limit to top 10 recommendations
  const topRecommended = recommended.slice(0, 10);

  let hint: string | undefined;
  if (topRecommended.length > 0) {
    hint = "External MCP tools available for this task. Use them directly when needed.";
  }

  return {
    recommended: topRecommended,
    categories: categories as string[],
    hint,
  };
}

/**
 * Detect the best agent for a task based on keyword matching
 */
function detectAgent(task: string): { agent: string; confidence: number } {
  const lowerTask = task.toLowerCase();
  let bestAgent = "coder";
  let bestScore = 0;

  for (const [agentId, context] of Object.entries(AGENT_CONTEXTS)) {
    let score = 0;
    for (const trigger of context.triggers) {
      if (lowerTask.includes(trigger)) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestAgent = agentId;
    }
  }

  return {
    agent: bestAgent,
    confidence: Math.min(bestScore / 3, 1),
  };
}

export const getAgentContextTool = createTool({
  id: "get-agent-context",
  description:
    "Get specialized agent instructions and context for a task (no API key required). Use tier=1 for metadata only (discovery), tier=2 for full context (default). Claude Code should ADOPT these instructions.",
  inputSchema,
  outputSchema,
  execute: async (input) => {
    // Handle Mastra's context wrapping
    const data = input as {
      context?: { task?: string; agent?: string; tier?: number };
      task?: string;
      agent?: string;
      tier?: number;
    };
    const task = data?.context?.task || data?.task || "";
    const requestedAgent = data?.context?.agent || data?.agent;
    const tier = data?.context?.tier ?? data?.tier ?? 2;

    let agentId: string;
    let confidence: number;

    // Use requested agent if valid, otherwise auto-detect
    if (requestedAgent && AGENT_CONTEXTS[requestedAgent]) {
      agentId = requestedAgent;
      confidence = 1.0;
    } else {
      const detected = detectAgent(task);
      agentId = detected.agent;
      confidence = detected.confidence;
    }

    // Use getAgentContextWithConstraints to inject global documentation requirement
    const ctx = getAgentContextWithConstraints(agentId);
    if (!ctx) {
      // Fallback to coder
      const fallback = AGENT_CONTEXTS.coder;
      if (!fallback) {
        throw new Error("Coder agent context is missing");
      }
      if (tier === 1) {
        return {
          agent: "coder",
          confidence: 0,
          tier: 1,
          tokensUsed: fallback.tier1TokenEstimate,
          metadata: {
            id: fallback.id,
            name: fallback.name,
            description: fallback.description,
            triggers: fallback.triggers,
            capabilities: fallback.capabilities,
            recommendedModel: fallback.recommendedModel,
            modelRationale: fallback.modelRationale,
          },
        };
      }
      return {
        agent: "coder",
        confidence: 0,
        tier: 2,
        tokensUsed: fallback.tier1TokenEstimate + fallback.tier2TokenEstimate,
        metadata: {
          id: fallback.id,
          name: fallback.name,
          description: fallback.description,
          triggers: fallback.triggers,
          capabilities: fallback.capabilities,
          recommendedModel: fallback.recommendedModel,
          modelRationale: fallback.modelRationale,
        },
        context: {
          name: fallback.name,
          description: fallback.description,
          instructions: fallback.instructions,
          tools: fallback.tools,
          workflow: fallback.workflow,
          constraints: fallback.constraints,
          outputFormat: fallback.outputFormat,
        },
      };
    }

    // Get external tool recommendations
    const externalTools = getExternalToolRecommendations(agentId);

    // Tier 1: Metadata only (for discovery)
    if (tier === 1) {
      return {
        agent: agentId,
        confidence,
        tier: 1,
        tokensUsed: ctx.tier1TokenEstimate,
        metadata: {
          id: ctx.id,
          name: ctx.name,
          description: ctx.description,
          triggers: ctx.triggers,
          capabilities: ctx.capabilities,
          recommendedModel: ctx.recommendedModel,
          modelRationale: ctx.modelRationale,
        },
        externalTools: externalTools.recommended.length > 0 ? externalTools : undefined,
      };
    }

    // Tier 2: Full context (default, backward compatible)
    return {
      agent: agentId,
      confidence,
      tier: 2,
      tokensUsed: ctx.tier1TokenEstimate + ctx.tier2TokenEstimate,
      metadata: {
        id: ctx.id,
        name: ctx.name,
        description: ctx.description,
        triggers: ctx.triggers,
        capabilities: ctx.capabilities,
        recommendedModel: ctx.recommendedModel,
        modelRationale: ctx.modelRationale,
      },
      context: {
        name: ctx.name,
        description: ctx.description,
        instructions: ctx.instructions,
        tools: ctx.tools,
        workflow: ctx.workflow,
        constraints: ctx.constraints,
        outputFormat: ctx.outputFormat,
      },
      externalTools: externalTools.recommended.length > 0 ? externalTools : undefined,
    };
  },
});

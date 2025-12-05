/**
 * Flynn Orchestrator Agent
 * Main routing agent that delegates to specialized sub-agents
 */

import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { anthropic } from "@ai-sdk/anthropic";
import { getMemoryDbPath } from "@flynn/core";

import { orchestratorInstructions } from "./instructions.js";
import { installer } from "./installer.js";
import { diagnostic } from "./diagnostic.js";
import { scaffolder } from "./scaffolder.js";
import { coder } from "./coder.js";
import { refactor } from "./refactor.js";
import { release } from "./release.js";
import { healer } from "./healer.js";
import { data } from "./data.js";
import { analysisWorkflow, bootstrapWorkflow } from "./workflows/index.js";

// Memory storage path (XDG compliant via @flynn/core)
const memoryPath = getMemoryDbPath();

// Shared memory instance for conversation context
const memory = new Memory({
  storage: new LibSQLStore({
    id: "flynn-memory",
    url: `file:${memoryPath}`,
  }),
  options: {
    lastMessages: 20,
  },
});

/**
 * Flynn Orchestrator - Main entry point for all requests
 *
 * Routes to specialized sub-agents based on intent analysis.
 * Uses Mastra's Agent Network for automatic delegation.
 */
export const orchestrator = new Agent({
  id: "flynn-orchestrator",
  name: "Flynn",
  description: "AI development orchestrator that routes tasks to specialized agents",
  model: anthropic("claude-opus-4-5-20251101"),
  instructions: orchestratorInstructions,
  memory,

  // Sub-agents for delegation via Agent Network
  agents: [installer, diagnostic, scaffolder, coder, refactor, release, healer, data],

  // Workflows for multi-step operations via Agent Network
  workflows: {
    analysisWorkflow,
    bootstrapWorkflow,
  },

  // Note: inputProcessors/outputProcessors for Guardrails can be added here
  // See DESIGN.md "LLM Guardrails" section for implementation
});

/**
 * Generate response using the orchestrator
 *
 * @param prompt - User's request
 * @param options - Optional configuration (toolsets for dynamic MCP tools)
 */
export async function generateResponse(
  prompt: string,
  options?: {
    resourceId?: string;
    threadId?: string;
    toolsets?: Record<string, unknown>;
  },
) {
  const { resourceId = "default", threadId, toolsets } = options ?? {};

  return orchestrator.generate(prompt, {
    resourceId,
    threadId,
    toolsets, // Dynamic MCP tools injection
  });
}

/**
 * Stream response using the orchestrator
 *
 * @param prompt - User's request
 * @param options - Optional configuration (toolsets for dynamic MCP tools)
 */
export async function streamResponse(
  prompt: string,
  options?: {
    resourceId?: string;
    threadId?: string;
    toolsets?: Record<string, unknown>;
  },
) {
  const { resourceId = "default", threadId, toolsets } = options ?? {};

  return orchestrator.stream(prompt, {
    resourceId,
    threadId,
    toolsets, // Dynamic MCP tools injection
  });
}

/**
 * Execute orchestrator as agent network (multi-agent delegation)
 *
 * Uses Mastra's Agent Network feature for automatic routing to sub-agents,
 * workflows, and tools based on the request content.
 *
 * @param prompt - User's request
 * @returns AsyncIterable of network execution events
 *
 * @example
 * ```typescript
 * const events = await networkResponse("Analyze the project structure");
 * for await (const event of events) {
 *   if (event.type === "network-execution-event-step-finish") {
 *     console.log(event.payload.result);
 *   }
 * }
 * ```
 */
export function networkResponse(prompt: string) {
  return orchestrator.network(prompt);
}

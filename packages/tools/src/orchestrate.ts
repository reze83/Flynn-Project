/**
 * Orchestrate Tool
 *
 * Plans multi-agent workflows for complex tasks.
 * Returns a sequence of agents with their contexts.
 *
 * Refactored to use:
 * - workflow-templates.ts: Template definitions and detection
 * - parallel-optimizer.ts: Parallel execution optimization
 */

import { createLogger } from "@flynn/core";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { AGENT_CONTEXTS } from "./agent-contexts.js";
import { AgentFactory } from "./agents/agent-factory.js";
import {
  type AgentInfo,
  buildOptimizationMetrics,
  determineSuggestedFlow,
  findIndependentGroups,
  findParallelGroups,
} from "./parallel-optimizer.js";
import { WORKFLOW_TEMPLATES, detectTemplate } from "./workflow-templates.js";

const logger = createLogger("orchestrate");

// ============================================================================
// Environment Configuration
// ============================================================================

/** Environment variable key for parallel threshold configuration */
const ENV_PARALLEL_THRESHOLD = "FLYNN_PARALLEL_THRESHOLD" as const;

/** Environment variable key for orchestration mode configuration */
const ENV_PARALLEL_MODE = "FLYNN_PARALLEL_MODE" as const;

/**
 * Default minimum number of independent steps to trigger parallelization
 * Can be overridden via FLYNN_PARALLEL_THRESHOLD environment variable
 */
const DEFAULT_PARALLEL_THRESHOLD: number =
  Number.parseInt(process.env[ENV_PARALLEL_THRESHOLD] || "2", 10) || 2;

/**
 * Default orchestration mode (auto, sequential, or parallel)
 * Can be overridden via FLYNN_PARALLEL_MODE environment variable
 */
const DEFAULT_ORCHESTRATION_MODE: "auto" | "sequential" | "parallel" =
  (process.env[ENV_PARALLEL_MODE] as "auto" | "sequential" | "parallel") || "auto";

// ============================================================================
// Zod Schemas - Exported for reuse and type inference
// ============================================================================

/**
 * Input schema for orchestration requests
 * @see OrchestrationInput for inferred type
 */
export const OrchestrationInputSchema = z.object({
  task: z.string().describe("Complex task requiring multiple agents"),
  workflow: z
    .string()
    .optional()
    .describe(
      "Explicit workflow name (e.g., 'fix-bug', 'new-project'). If not provided, auto-detects from task.",
    ),
  mode: z.enum(["auto", "sequential", "parallel"]).optional().default(DEFAULT_ORCHESTRATION_MODE),
  parallel_threshold: z
    .number()
    .optional()
    .default(DEFAULT_PARALLEL_THRESHOLD)
    .describe(
      `Minimum number of independent steps to trigger parallelization (default: ${DEFAULT_PARALLEL_THRESHOLD})`,
    ),
  auto_optimize: z
    .boolean()
    .optional()
    .default(true)
    .describe("Automatically detect and optimize parallel execution opportunities"),
});

/**
 * Schema for individual agent step in workflow
 * @see AgentStep for inferred type
 */
export const AgentStepSchema = z.object({
  id: z.string(),
  role: z.string(),
  subtask: z.string(),
  instructions: z.string(),
  tools: z.array(z.string()),
  workflow: z.array(z.string()),
  constraints: z.array(z.string()),
  recommendedMcpTools: z.array(z.string()).optional(),
});

/**
 * Output schema for orchestration response
 * @see OrchestrationOutput for inferred type
 */
export const OrchestrationOutputSchema = z.object({
  template: z.string(),
  agents: z.array(AgentStepSchema),
  suggestedFlow: z.enum(["sequential", "parallel", "mixed"]),
  parallelGroups: z.array(z.array(z.string())),
  totalSteps: z.number(),
  optimization: z
    .object({
      auto_optimized: z.boolean(),
      parallel_opportunities: z.number(),
      estimated_speedup: z.string(),
      independent_groups: z.array(
        z.object({
          agents: z.array(z.string()),
          reason: z.string(),
        }),
      ),
    })
    .optional(),
});

// Type inference from schemas
export type OrchestrationInput = z.infer<typeof OrchestrationInputSchema>;
export type AgentStep = z.infer<typeof AgentStepSchema>;
export type OrchestrationOutput = z.infer<typeof OrchestrationOutputSchema>;

/**
 * Clean task input by removing redundant command keywords
 * Users often type "/flynn orchestrate 'task'" when "/flynn task" suffices
 */
function cleanTaskInput(task: string): string {
  // Remove leading "orchestrate" keyword (with optional typos)
  // Also removes surrounding quotes that users sometimes add
  return task
    .replace(/^["']?orchestrat[ea]?\s*/i, "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

/**
 * Normalize input data from different formats
 */
function normalizeInputData(input: unknown): {
  task: string;
  explicitWorkflow?: string;
  mode: string;
  parallelThreshold: number;
  autoOptimize: boolean;
} {
  const data = input as {
    context?: {
      task?: string;
      workflow?: string;
      mode?: string;
      parallel_threshold?: number;
      auto_optimize?: boolean;
    };
    task?: string;
    workflow?: string;
    mode?: string;
    parallel_threshold?: number;
    auto_optimize?: boolean;
  };

  const rawTask = data?.context?.task || data?.task || "";

  return {
    task: cleanTaskInput(rawTask),
    explicitWorkflow: data?.context?.workflow || data?.workflow,
    mode: data?.context?.mode || data?.mode || "auto",
    parallelThreshold: data?.context?.parallel_threshold || data?.parallel_threshold || 2,
    autoOptimize: data?.context?.auto_optimize ?? data?.auto_optimize ?? true,
  };
}

/**
 * Build agent steps from template and contexts
 */
function buildAgentSteps(agentSequence: string[]) {
  return AgentFactory.createAgentSteps(agentSequence, AGENT_CONTEXTS);
}

export const orchestrateTool = createTool({
  id: "orchestrate",
  description:
    "Plan multi-agent workflow for complex tasks. Returns sequence of agents with full context. Use workflow parameter to select explicitly, or let it auto-detect.",
  inputSchema: OrchestrationInputSchema,
  outputSchema: OrchestrationOutputSchema,
  execute: async (input) => {
    const { task, explicitWorkflow, mode, parallelThreshold, autoOptimize } =
      normalizeInputData(input);

    // Determine template with validation
    const template =
      explicitWorkflow && WORKFLOW_TEMPLATES[explicitWorkflow]
        ? explicitWorkflow
        : detectTemplate(task);

    // Validate template exists, fallback to default if not
    if (!WORKFLOW_TEMPLATES[template]) {
      logger.warn({ template }, 'Unknown workflow template, falling back to default "coder" agent');
    }

    const agentSequence = WORKFLOW_TEMPLATES[template] || ["coder"];

    // Build agent steps with contexts
    const agents = buildAgentSteps(agentSequence);

    // Convert to AgentInfo for parallel analysis
    const agentInfos: AgentInfo[] = agents.map((a) => ({ id: a.id, role: a.role }));

    // Enhanced parallel detection with auto-optimization
    const parallelGroups = findParallelGroups(agentInfos, autoOptimize);
    const independentGroups = autoOptimize ? findIndependentGroups(agentInfos) : [];

    // Apply parallel threshold
    const effectiveParallelGroups = parallelGroups.filter((g) => g.length >= parallelThreshold);

    const suggestedFlow = determineSuggestedFlow(mode, effectiveParallelGroups, independentGroups);
    const optimization = buildOptimizationMetrics(
      autoOptimize,
      effectiveParallelGroups,
      independentGroups,
      agents.length,
    );

    return {
      template,
      agents,
      suggestedFlow,
      parallelGroups: effectiveParallelGroups,
      totalSteps: agents.length,
      optimization,
    };
  },
});

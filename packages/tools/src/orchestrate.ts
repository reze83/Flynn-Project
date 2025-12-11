/**
 * Orchestrate Tool
 *
 * Plans multi-agent workflows for complex tasks.
 * Returns a sequence of agents with their contexts.
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { AGENT_CONTEXTS } from "./agent-contexts.js";

// Environment defaults for parallelization
// Users can override these via environment variables, e.g. FLYNN_PARALLEL_THRESHOLD=3
const DEFAULT_PARALLEL_THRESHOLD: number = Number.parseInt(
  process.env.FLYNN_PARALLEL_THRESHOLD || "2",
  10,
) || 2;
const DEFAULT_ORCHESTRATION_MODE: "auto" | "sequential" | "parallel" =
  (process.env.FLYNN_PARALLEL_MODE as "auto" | "sequential" | "parallel") ||
  "auto";

// Workflow templates for common patterns
const WORKFLOW_TEMPLATES: Record<string, string[]> = {
  // Basic workflows
  "new-project": ["scaffolder", "coder", "diagnostic"],
  "fix-bug": ["diagnostic", "coder", "diagnostic"],
  "add-feature": ["coder", "diagnostic"],
  refactor: ["diagnostic", "refactor", "diagnostic"],
  release: ["diagnostic", "release"],
  setup: ["installer", "diagnostic"],
  analyze: ["diagnostic"],
  "data-task": ["data"],
  recover: ["healer"],

  // Review workflows
  "security-audit": ["security"],
  "code-review": ["reviewer"],
  "performance-audit": ["performance"],
  "full-review": ["reviewer", "security", "performance"],
  "secure-release": ["security", "diagnostic", "release"],

  // Advanced multi-agent workflows (Sprint 2)
  "full-stack-feature": [
    "api-designer",
    "database-architect",
    "coder",
    "frontend-architect",
    "test-architect",
    "security",
    "devops-engineer",
  ],
  "security-hardening": ["security", "reviewer", "diagnostic", "coder"],
  "ml-pipeline": ["data-engineer", "ml-engineer", "coder", "test-architect", "devops-engineer"],
  "incident-response": ["diagnostic", "incident-responder", "coder", "healer"],
  "codebase-migration": [
    "diagnostic",
    "migration-specialist",
    "coder",
    "test-architect",
    "reviewer",
    "documentation-architect",
  ],

  // Documentation workflows
  "documentation-suite": ["diagnostic", "documentation-architect", "api-designer", "reviewer"],

  // Codex Integration workflows
  "codex-delegation": ["orchestrator", "coder", "diagnostic"],
  "hybrid-implementation": ["orchestrator", "api-designer", "orchestrator", "diagnostic"],
  "codex-specialist": ["diagnostic", "orchestrator", "diagnostic"],
};

// Keywords that map to templates
const TEMPLATE_TRIGGERS: Record<string, string[]> = {
  "new-project": [
    "new project",
    "create project",
    "scaffold project",
    "initialize project",
    "start project",
  ],
  "fix-bug": ["fix", "bug", "error", "broken", "crash", "issue", "failing"],
  "add-feature": ["add", "implement", "feature", "build", "create", "write"],
  refactor: ["refactor", "improve", "clean", "optimize", "restructure"],
  release: ["release", "publish", "version", "deploy", "tag"],
  setup: ["install", "setup", "configure", "dependencies", "environment"],
  analyze: ["analyze", "check", "diagnose", "inspect", "review"],
  "data-task": ["data", "csv", "json", "statistics", "ml", "pandas"],
  recover: ["recover", "heal", "restore", "rollback", "undo"],
  "security-audit": ["security", "vulnerability", "cve", "audit", "owasp", "pentest", "secure"],
  "code-review": ["review", "pr", "pull request", "feedback", "quality"],
  "performance-audit": [
    "performance",
    "slow",
    "speed",
    "memory",
    "profile",
    "benchmark",
    "bottleneck",
  ],
  "full-review": ["full review", "comprehensive review", "complete review"],
  "secure-release": ["secure release", "production deploy", "safe release"],

  // Advanced workflows (Sprint 2)
  "full-stack-feature": [
    "full stack",
    "end-to-end feature",
    "full feature",
    "complete feature",
    "feature with api",
    "feature with frontend",
  ],
  "security-hardening": [
    "harden",
    "security fix",
    "security hardening",
    "fix vulnerabilities",
    "secure the code",
  ],
  "ml-pipeline": [
    "ml pipeline",
    "machine learning pipeline",
    "train model",
    "build model",
    "ml workflow",
    "data science",
  ],
  "incident-response": [
    "incident",
    "outage",
    "production down",
    "system down",
    "emergency fix",
    "sev1",
    "post-mortem",
  ],
  "codebase-migration": [
    "migrate codebase",
    "framework migration",
    "upgrade framework",
    "legacy migration",
    "modernize codebase",
    "version upgrade",
  ],

  // Documentation workflows
  "documentation-suite": [
    "documentation suite",
    "full documentation",
    "comprehensive documentation",
    "project documentation",
    "generate docs",
    "create documentation",
    "document project",
    "write docs",
  ],

  // Codex Integration workflows
  "codex-delegation": ["delegate to codex", "use codex", "codex task", "gpt", "openai"],
  "hybrid-implementation": ["hybrid", "multi-ai", "claude and codex", "design then implement"],
  "codex-specialist": ["codex specialist", "expert codex", "delegate specialist"],
};

const inputSchema = z.object({
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

const agentStepSchema = z.object({
  id: z.string(),
  role: z.string(),
  subtask: z.string(),
  instructions: z.string(),
  tools: z.array(z.string()),
  workflow: z.array(z.string()),
  constraints: z.array(z.string()),
});

const outputSchema = z.object({
  template: z.string(),
  agents: z.array(agentStepSchema),
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

/**
 * Detect which workflow template to use
 */
function detectTemplate(task: string): string {
  const lowerTask = task.toLowerCase();
  let bestTemplate = "add-feature";
  let bestScore = 0;

  for (const [template, triggers] of Object.entries(TEMPLATE_TRIGGERS)) {
    let score = 0;
    for (const trigger of triggers) {
      if (lowerTask.includes(trigger)) {
        score += trigger.split(" ").length; // Multi-word triggers score higher
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestTemplate = template;
    }
  }

  return bestTemplate;
}

// Agent dependency map - which agents depend on others
const AGENT_DEPENDENCIES: Record<string, string[]> = {
  // Core agents
  coder: ["diagnostic", "api-designer", "database-architect"], // coder needs analysis first
  diagnostic: [], // diagnostic can run independently
  scaffolder: [], // scaffolder can run independently
  installer: [], // installer can run independently
  refactor: ["diagnostic"], // refactor needs diagnosis first
  release: ["diagnostic", "coder", "security"], // release needs everything verified
  healer: ["diagnostic"], // healer needs diagnosis

  // Review agents - can run in parallel with each other
  security: [], // security can run independently
  reviewer: [], // reviewer can run independently
  performance: [], // performance can run independently

  // Architecture agents - mostly independent
  "api-designer": [], // can design independently
  "database-architect": [], // can design independently
  "frontend-architect": ["api-designer"], // needs API design
  "system-architect": [], // can design independently

  // Specialized agents
  "test-architect": ["coder"], // needs code to test
  "documentation-architect": ["coder", "api-designer"], // needs implementation
  "devops-engineer": ["coder", "test-architect"], // needs code and tests
  "ml-engineer": ["data-engineer"], // needs data pipeline
  "data-engineer": [], // can work independently
  "migration-specialist": ["diagnostic"], // needs analysis
  "incident-responder": ["diagnostic"], // needs diagnosis

  // Orchestration agents
  orchestrator: ["diagnostic"], // orchestrator benefits from diagnostics
};

/**
 * Find parallel groups using simple same-role heuristic
 */
function findParallelGroupsSimple(agents: Array<{ id: string; role: string }>): string[][] {
  const groups: string[][] = [];
  let currentGroup: string[] = [];
  let currentRole = "";

  for (const agent of agents) {
    if (agent.role === currentRole) {
      currentGroup.push(agent.id);
    } else {
      if (currentGroup.length > 1) {
        groups.push([...currentGroup]);
      }
      currentGroup = [agent.id];
      currentRole = agent.role;
    }
  }

  if (currentGroup.length > 1) {
    groups.push(currentGroup);
  }

  return groups;
}

/**
 * Check if an agent can run based on dependencies
 */
function canAgentRun(
  agent: { id: string; role: string },
  agentRoles: string[],
  completedRoles: Set<string>,
  agentIndex: number,
): boolean {
  const deps = AGENT_DEPENDENCIES[agent.role] || [];
  return deps.every(
    (dep) => completedRoles.has(dep) || !agentRoles.slice(0, agentIndex).includes(dep),
  );
}

/**
 * Find parallel candidates at current position using dependency analysis
 */
function findParallelCandidatesAt(
  agents: Array<{ id: string; role: string }>,
  startIndex: number,
  agentRoles: string[],
  completedRoles: Set<string>,
): string[] {
  const candidates: string[] = [];

  for (let j = startIndex; j < agents.length; j++) {
    const agent = agents[j];
    if (!agent) continue;

    if (canAgentRun(agent, agentRoles, completedRoles, j)) {
      candidates.push(agent.id);
    } else {
      break; // Stop at first agent with unmet dependencies
    }
  }

  return candidates;
}

/**
 * Mark agents as completed in the role set
 */
function markAgentsCompleted(
  agents: Array<{ id: string; role: string }>,
  agentIds: string[],
  completedRoles: Set<string>,
): void {
  for (const id of agentIds) {
    const agent = agents.find((a) => a.id === id);
    if (agent) completedRoles.add(agent.role);
  }
}

/**
 * Find parallel groups using enhanced dependency analysis
 */
function findParallelGroupsEnhanced(agents: Array<{ id: string; role: string }>): string[][] {
  const groups: string[][] = [];
  const agentRoles = agents.map((a) => a.role);
  const completedRoles = new Set<string>();

  let i = 0;
  while (i < agents.length) {
    const parallelCandidates = findParallelCandidatesAt(agents, i, agentRoles, completedRoles);

    if (parallelCandidates.length > 1) {
      groups.push(parallelCandidates);
    }

    markAgentsCompleted(agents, parallelCandidates, completedRoles);
    i += Math.max(1, parallelCandidates.length);
  }

  return groups;
}

/**
 * Find groups of agents that can run in parallel (enhanced with dependency analysis)
 */
function findParallelGroups(
  agents: Array<{ id: string; role: string }>,
  autoOptimize = true,
): string[][] {
  if (!autoOptimize) {
    return findParallelGroupsSimple(agents);
  }
  return findParallelGroupsEnhanced(agents);
}

/**
 * Analyze and find independent agent groups with reasons
 */
function findIndependentGroups(
  agents: Array<{ id: string; role: string }>,
): Array<{ agents: string[]; reason: string }> {
  const independentGroups: Array<{ agents: string[]; reason: string }> = [];

  // Find review agents that can run in parallel
  const reviewAgents = agents.filter((a) =>
    ["security", "reviewer", "performance"].includes(a.role),
  );
  if (reviewAgents.length > 1) {
    independentGroups.push({
      agents: reviewAgents.map((a) => a.id),
      reason: "Review agents have no inter-dependencies",
    });
  }

  // Find architecture agents that can run in parallel
  const archAgents = agents.filter((a) =>
    ["api-designer", "database-architect", "system-architect"].includes(a.role),
  );
  if (archAgents.length > 1) {
    independentGroups.push({
      agents: archAgents.map((a) => a.id),
      reason: "Architecture design agents can work independently",
    });
  }

  // Find data pipeline agents
  const dataAgents = agents.filter((a) => ["data", "data-engineer"].includes(a.role));
  const searchAgents = agents.filter((a) => a.role === "diagnostic" && agents.indexOf(a) === 0);
  if (dataAgents.length > 0 && searchAgents.length > 0) {
    independentGroups.push({
      agents: [...dataAgents, ...searchAgents].map((a) => a.id),
      reason: "Data analysis and diagnostics can run concurrently",
    });
  }

  return independentGroups;
}

/**
 * Calculate estimated speedup from parallelization
 */
function calculateSpeedup(
  totalSteps: number,
  parallelGroups: string[][],
  independentGroups: Array<{ agents: string[] }>,
): string {
  if (parallelGroups.length === 0 && independentGroups.length === 0) {
    return "1x (no parallelization)";
  }

  const parallelSteps = parallelGroups.reduce((sum, g) => sum + g.length, 0);
  const independentSteps = independentGroups.reduce((sum, g) => sum + g.agents.length, 0);
  const totalParallel = Math.max(parallelSteps, independentSteps);

  if (totalParallel === 0) return "1x (no parallelization)";

  const effectiveSteps = totalSteps - totalParallel + Math.ceil(totalParallel / 2);
  const speedup = totalSteps / effectiveSteps;

  return `~${speedup.toFixed(1)}x faster`;
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

  return {
    task: data?.context?.task || data?.task || "",
    explicitWorkflow: data?.context?.workflow || data?.workflow,
    mode: data?.context?.mode || data?.mode || "auto",
    parallelThreshold: data?.context?.parallel_threshold || data?.parallel_threshold || 2,
    autoOptimize: data?.context?.auto_optimize ?? data?.auto_optimize ?? true,
  };
}

/**
 * Determine the suggested flow based on mode and parallel opportunities
 */
function determineSuggestedFlow(
  mode: string,
  effectiveParallelGroups: string[][],
  independentGroups: Array<{ agents: string[]; reason: string }>,
): "sequential" | "parallel" | "mixed" {
  if (mode === "parallel") {
    return "parallel";
  }
  if (mode === "sequential") {
    return "sequential";
  }

  // Auto mode with optimization
  const hasParallel = effectiveParallelGroups.length > 0 || independentGroups.length > 0;
  return hasParallel ? "mixed" : "sequential";
}

/**
 * Build optimization metrics object
 */
function buildOptimizationMetrics(
  autoOptimize: boolean,
  effectiveParallelGroups: string[][],
  independentGroups: Array<{ agents: string[]; reason: string }>,
  totalAgents: number,
) {
  if (!autoOptimize) {
    return {
      auto_optimized: false,
      parallel_opportunities: 0,
      estimated_speedup: "1x (optimization disabled)",
      independent_groups: [],
    };
  }

  return {
    auto_optimized: true,
    parallel_opportunities: effectiveParallelGroups.length + independentGroups.length,
    estimated_speedup: calculateSpeedup(totalAgents, effectiveParallelGroups, independentGroups),
    independent_groups: independentGroups,
  };
}

export const orchestrateTool = createTool({
  id: "orchestrate",
  description:
    "Plan multi-agent workflow for complex tasks. Returns sequence of agents with full context. Use workflow parameter to select explicitly, or let it auto-detect.",
  inputSchema,
  outputSchema,
  execute: async (input) => {
    const { task, explicitWorkflow, mode, parallelThreshold, autoOptimize } =
      normalizeInputData(input);

    // Use explicit workflow if provided, otherwise auto-detect
    const template =
      explicitWorkflow && WORKFLOW_TEMPLATES[explicitWorkflow]
        ? explicitWorkflow
        : detectTemplate(task);
    const agentSequence = WORKFLOW_TEMPLATES[template] || ["coder"];

    const agents = agentSequence.map((role, idx) => {
      const ctx = AGENT_CONTEXTS[role];
      if (!ctx) {
        // Fallback to coder
        const fallback = AGENT_CONTEXTS.coder;
        if (!fallback) {
          throw new Error("Coder agent context is missing");
        }
        return {
          id: `coder-${idx + 1}`,
          role: "coder",
          subtask: `Step ${idx + 1}: ${fallback.description}`,
          instructions: fallback.instructions,
          tools: fallback.tools,
          workflow: fallback.workflow,
          constraints: fallback.constraints,
        };
      }
      return {
        id: `${role}-${idx + 1}`,
        role,
        subtask: `Step ${idx + 1}: ${ctx.description}`,
        instructions: ctx.instructions,
        tools: ctx.tools,
        workflow: ctx.workflow,
        constraints: ctx.constraints,
      };
    });

    // Enhanced parallel detection with auto-optimization
    const parallelGroups = findParallelGroups(agents, autoOptimize);
    const independentGroups = autoOptimize ? findIndependentGroups(agents) : [];

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

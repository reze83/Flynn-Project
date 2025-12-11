/**
 * Parallel Optimizer
 *
 * Provides dependency analysis and parallel execution optimization
 * for multi-agent workflows. Extracted from orchestrate.ts to improve
 * maintainability and enable reuse.
 */

/**
 * Agent dependency map - defines which agents depend on others
 * Agents with empty dependencies can run independently
 */
export const AGENT_DEPENDENCIES: Record<string, string[]> = {
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
 * Simple agent info for parallel analysis
 */
export interface AgentInfo {
  id: string;
  role: string;
}

/**
 * Independent group with explanation
 */
export interface IndependentGroup {
  agents: string[];
  reason: string;
}

/**
 * Find parallel groups using simple same-role heuristic
 */
function findParallelGroupsSimple(agents: AgentInfo[]): string[][] {
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
  agent: AgentInfo,
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
  agents: AgentInfo[],
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
  agents: AgentInfo[],
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
function findParallelGroupsEnhanced(agents: AgentInfo[]): string[][] {
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
 * Find groups of agents that can run in parallel
 * Uses enhanced dependency analysis when autoOptimize is true
 */
export function findParallelGroups(agents: AgentInfo[], autoOptimize = true): string[][] {
  if (!autoOptimize) {
    return findParallelGroupsSimple(agents);
  }
  return findParallelGroupsEnhanced(agents);
}

/**
 * Analyze and find independent agent groups with reasons
 */
export function findIndependentGroups(agents: AgentInfo[]): IndependentGroup[] {
  const independentGroups: IndependentGroup[] = [];

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
export function calculateSpeedup(
  totalSteps: number,
  parallelGroups: string[][],
  independentGroups: IndependentGroup[],
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
 * Determine the suggested flow based on mode and parallel opportunities
 */
export function determineSuggestedFlow(
  mode: string,
  effectiveParallelGroups: string[][],
  independentGroups: IndependentGroup[],
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
export function buildOptimizationMetrics(
  autoOptimize: boolean,
  effectiveParallelGroups: string[][],
  independentGroups: IndependentGroup[],
  totalAgents: number,
) {
  if (!autoOptimize) {
    return {
      auto_optimized: false,
      parallel_opportunities: 0,
      estimated_speedup: "1x (optimization disabled)",
      independent_groups: [] as IndependentGroup[],
    };
  }

  return {
    auto_optimized: true,
    parallel_opportunities: effectiveParallelGroups.length + independentGroups.length,
    estimated_speedup: calculateSpeedup(totalAgents, effectiveParallelGroups, independentGroups),
    independent_groups: independentGroups,
  };
}

/**
 * Get dependencies for an agent role
 */
export function getAgentDependencies(role: string): string[] {
  return AGENT_DEPENDENCIES[role] || [];
}

/**
 * Check if an agent role is independent (has no dependencies)
 */
export function isIndependentAgent(role: string): boolean {
  const deps = AGENT_DEPENDENCIES[role];
  return !deps || deps.length === 0;
}

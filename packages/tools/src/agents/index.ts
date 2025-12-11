/**
 * Agent Contexts - Structured agent expertise for Claude Code
 *
 * This module provides a modular organization of all agent definitions.
 * Claude Code uses these contexts to "become" the appropriate agent.
 */

// Re-export types
export type { AgentContext } from "./types.js";

import { ARCHITECTURE_AGENTS } from "./architecture-agents.js";
// Import agent groups
import { CORE_AGENTS } from "./core-agents.js";
import { DOMAIN_AGENTS } from "./domain-agents.js";
import { OPERATIONS_AGENTS } from "./operations-agents.js";
import { SPECIALIZED_AGENTS } from "./specialized-agents.js";

// Import Codex orchestrator
import { codexOrchestrator } from "./codex-orchestrator.js";

// Re-export individual agent groups for selective imports
export { CORE_AGENTS } from "./core-agents.js";
export { SPECIALIZED_AGENTS } from "./specialized-agents.js";
export { ARCHITECTURE_AGENTS } from "./architecture-agents.js";
export { OPERATIONS_AGENTS } from "./operations-agents.js";
export { DOMAIN_AGENTS } from "./domain-agents.js";

// Re-export individual agents for direct access
export {
  coder,
  diagnostic,
  scaffolder,
  installer,
  refactor,
  release,
  healer,
} from "./core-agents.js";

export { data, security, reviewer, performance } from "./specialized-agents.js";

export {
  systemArchitect,
  databaseArchitect,
  frontendArchitect,
  apiDesigner,
} from "./architecture-agents.js";

export {
  devopsEngineer,
  terraformExpert,
  kubernetesOperator,
  incidentResponder,
} from "./operations-agents.js";

export {
  migrationSpecialist,
  testArchitect,
  documentationArchitect,
  mlEngineer,
  dataEngineer,
  mobileDeveloper,
  blockchainDeveloper,
} from "./domain-agents.js";

// Export Codex orchestrator
export { codexOrchestrator } from "./codex-orchestrator.js";

import type { AgentContext } from "./types.js";

/**
 * Combined registry of all agent contexts
 */
export const AGENT_CONTEXTS: Record<string, AgentContext> = {
  ...CORE_AGENTS,
  ...SPECIALIZED_AGENTS,
  ...ARCHITECTURE_AGENTS,
  ...OPERATIONS_AGENTS,
  ...DOMAIN_AGENTS,
  // Codex Integration
  orchestrator: codexOrchestrator,
};

/**
 * GLOBAL CONSTRAINT: Documentation requirement for optimization suggestions
 * Agents that make optimization/improvement suggestions must fetch official docs first.
 */
const DOCUMENTATION_REQUIREMENT = `

## WICHTIG: Dokumentations-Pflicht bei Vorschlägen
Bei JEDEM Optimierungs- oder Verbesserungsvorschlag:
1. **Zuerst** offizielle Dokumentation der betroffenen Technologie abrufen
2. Verwende Context7 (mcp__context7__get-library-docs) oder Exa (mcp__exa__get_code_context_exa)
3. Dokumentations-Link und Version im Vorschlag angeben
4. **Keine Empfehlungen ohne aktuelle, offizielle Quellen**
`;

/**
 * Agents that make optimization/improvement suggestions
 * These agents get the documentation requirement injected
 */
const OPTIMIZATION_AGENTS = ["refactor", "performance", "reviewer", "security", "coder"];

/**
 * Get agent context by ID
 */
export function getAgentContext(agentId: string): AgentContext | undefined {
  return AGENT_CONTEXTS[agentId];
}

/**
 * Get agent context with global constraints applied
 * Use this when agents make suggestions that require documentation backing
 */
export function getAgentContextWithConstraints(agentId: string): AgentContext | undefined {
  const ctx = AGENT_CONTEXTS[agentId];
  if (!ctx) return undefined;

  // Inject documentation requirement for optimization agents
  if (OPTIMIZATION_AGENTS.includes(agentId)) {
    return {
      ...ctx,
      instructions: ctx.instructions + DOCUMENTATION_REQUIREMENT,
      constraints: [
        ...ctx.constraints,
        "Keine Optimierungsvorschläge ohne Dokumentations-Referenz",
      ],
    };
  }

  return ctx;
}

/**
 * Get all agent IDs
 */
export function getAgentIds(): string[] {
  return Object.keys(AGENT_CONTEXTS);
}

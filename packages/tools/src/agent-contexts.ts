/**
 * Agent Contexts - Structured agent expertise for Claude Code
 *
 * This file re-exports from the modular agents/ directory for backward compatibility.
 * For new code, prefer importing directly from './agents/index.js'.
 */

// Re-export everything from the modular structure
export {
  // Types
  type AgentContext,
  // Combined registry
  AGENT_CONTEXTS,
  // Helper functions
  getAgentContext,
  getAgentContextWithConstraints,
  getAgentIds,
  // Agent groups
  CORE_AGENTS,
  SPECIALIZED_AGENTS,
  ARCHITECTURE_AGENTS,
  OPERATIONS_AGENTS,
  DOMAIN_AGENTS,
  // Individual core agents
  coder,
  diagnostic,
  scaffolder,
  installer,
  refactor,
  release,
  healer,
  // Individual specialized agents
  data,
  security,
  reviewer,
  performance,
  qaTester,
  // Individual architecture agents
  systemArchitect,
  databaseArchitect,
  frontendArchitect,
  apiDesigner,
  // Individual operations agents
  devopsEngineer,
  terraformExpert,
  kubernetesOperator,
  incidentResponder,
  // Individual domain agents
  migrationSpecialist,
  testArchitect,
  documentationArchitect,
  mlEngineer,
  dataEngineer,
  mobileDeveloper,
  blockchainDeveloper,
} from "./agents/index.js";

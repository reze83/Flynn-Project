/**
 * Flynn Refactor Agent
 * Improves code structure, optimizes, cleans up
 */

import { type AgentFactory, createAgentFactory } from "@flynn/core";
import { refactorInstructions } from "./instructions.js";

/**
 * Refactor Agent Factory
 *
 * Responsible for:
 * - Improving code structure without changing behavior
 * - Reducing technical debt
 * - Optimizing performance
 * - Enhancing readability
 *
 * @param tier - Model tier (opus, sonnet, haiku)
 * @returns Configured refactor agent
 */
export const createRefactor: AgentFactory = createAgentFactory({
  id: "flynn-refactor",
  name: "Flynn Refactor",
  description: "Improves code structure, optimizes, cleans up",
  instructions: refactorInstructions,
  // Tools will be injected via toolsets or statically assigned
  // See capabilities.yaml: file-ops, project-analysis
});

/** Default refactor instance (uses default model tier) */
export const refactor = createRefactor();

/**
 * Flynn Coder Agent
 * Writes and implements code, adds features
 */

import { type AgentFactory, createAgentFactory } from "@flynn/core";
import { coderInstructions } from "./instructions.js";

/**
 * Coder Agent Factory
 *
 * Responsible for:
 * - Implementing features based on specifications
 * - Writing clean, maintainable code
 * - Following project conventions
 * - Adding appropriate tests
 *
 * @param tier - Model tier (opus, sonnet, haiku)
 * @returns Configured coder agent
 */
export const createCoder: AgentFactory = createAgentFactory({
  id: "flynn-coder",
  name: "Flynn Coder",
  description: "Writes and implements code, adds features",
  instructions: coderInstructions,
  // Tools will be injected via toolsets or statically assigned
  // See capabilities.yaml: file-ops, project-analysis
});

/** Default coder instance (uses default model tier) */
export const coder = createCoder();

/**
 * Flynn Scaffolder Agent
 * Generates new projects, creates boilerplate code
 */

import { type AgentFactory, createAgentFactory } from "@flynn/core";
import { scaffolderInstructions } from "./instructions.js";

/**
 * Scaffolder Agent Factory
 *
 * Responsible for:
 * - Generating new project structures
 * - Creating boilerplate code
 * - Setting up build configurations
 * - Initializing git repositories
 *
 * @param tier - Model tier (opus, sonnet, haiku)
 * @returns Configured scaffolder agent
 */
export const createScaffolder: AgentFactory = createAgentFactory({
  id: "flynn-scaffolder",
  name: "Flynn Scaffolder",
  description: "Generates new projects, creates boilerplate code",
  instructions: scaffolderInstructions,
  // Tools will be injected via toolsets or statically assigned
  // See capabilities.yaml: file-ops, git-ops, shell
});

/** Default scaffolder instance (uses default model tier) */
export const scaffolder = createScaffolder();

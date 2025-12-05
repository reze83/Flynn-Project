/**
 * Flynn Release Agent
 * Prepares releases, manages versions, publishes packages
 */

import { createAgentFactory, type AgentFactory } from "@flynn/core";
import { releaseInstructions } from "./instructions.js";

/**
 * Release Agent Factory
 *
 * Responsible for:
 * - Preparing releases (version bumps)
 * - Generating changelogs
 * - Creating release tags
 * - Publishing packages
 *
 * @param tier - Model tier (opus, sonnet, haiku)
 * @returns Configured release agent
 */
export const createRelease: AgentFactory = createAgentFactory({
  id: "flynn-release",
  name: "Flynn Release",
  description: "Prepares releases, manages versions, publishes packages",
  instructions: releaseInstructions,
  // Tools will be injected via toolsets or statically assigned
  // See capabilities.yaml: git-ops, file-ops, shell
});

/** Default release instance (uses default model tier) */
export const release = createRelease();

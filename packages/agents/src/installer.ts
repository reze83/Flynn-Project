/**
 * Flynn Installer Agent
 * Handles installation, setup, and dependency management
 */

import { createAgentFactory, type AgentFactory } from "@flynn/core";
import { installerInstructions } from "./instructions.js";

/**
 * Installer Agent Factory
 *
 * Responsible for:
 * - Installing Node.js, pnpm, Python, uv, and other dependencies
 * - Configuring Claude Code CLI
 * - Setting up development environment
 * - Managing package installations
 *
 * @param tier - Model tier (opus, sonnet, haiku)
 * @returns Configured installer agent
 */
export const createInstaller: AgentFactory = createAgentFactory({
  id: "flynn-installer",
  name: "Flynn Installer",
  description: "Handles installation, setup, and dependency management",
  instructions: installerInstructions,
  // Tools will be injected via toolsets or statically assigned
  // See capabilities.yaml: shell, file-ops, git-ops
});

/** Default installer instance (uses default model tier) */
export const installer = createInstaller();

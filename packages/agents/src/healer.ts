/**
 * Flynn Healer Agent
 * Recovers from failures, retries with different approaches
 */

import { createAgentFactory, type AgentFactory } from "@flynn/core";
import { healerInstructions } from "./instructions.js";

/**
 * Healer Agent Factory
 *
 * Responsible for:
 * - Automatically recovering from agent failures
 * - Diagnosing why other agents failed
 * - Retrying with different approaches
 * - Escalating to user if unrecoverable
 *
 * Limits:
 * - Maximum 3 retry attempts
 * - Cannot invoke itself (no recursive healing)
 * - Must escalate to user after max retries
 *
 * @param tier - Model tier (opus, sonnet, haiku)
 * @returns Configured healer agent
 */
export const createHealer: AgentFactory = createAgentFactory({
  id: "flynn-healer",
  name: "Flynn Healer",
  description: "Recovers from failures, retries with different approaches",
  instructions: healerInstructions,
  // Tools will be injected via toolsets or statically assigned
  // See capabilities.yaml: shell, file-ops, project-analysis, system-info
  // Note: Limited toolset - not "*" to prevent uncontrolled operations
});

/** Default healer instance (uses default model tier) */
export const healer = createHealer();

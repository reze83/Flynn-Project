/**
 * Flynn Diagnostic Agent
 * Diagnoses issues, analyzes errors, troubleshoots problems
 */

import { type AgentFactory, createAgentFactory } from "@flynn/core";
import { diagnosticInstructions } from "./instructions.js";

/**
 * Diagnostic Agent Factory
 *
 * Responsible for:
 * - Analyzing error messages and stack traces
 * - Identifying root causes of issues
 * - Suggesting fixes and workarounds
 * - Checking system configuration
 *
 * @param tier - Model tier (opus, sonnet, haiku)
 * @returns Configured diagnostic agent
 */
export const createDiagnostic: AgentFactory = createAgentFactory({
  id: "flynn-diagnostic",
  name: "Flynn Diagnostic",
  description: "Diagnoses issues, analyzes errors, troubleshoots problems",
  instructions: diagnosticInstructions,
  // Tools will be injected via toolsets or statically assigned
  // See capabilities.yaml: project-analysis, system-info, shell
});

/** Default diagnostic instance (uses default model tier) */
export const diagnostic = createDiagnostic();

/**
 * Flynn Data Agent
 * Analyzes data, generates statistics, runs ML inference
 */

import { type AgentFactory, createAgentFactory } from "@flynn/core";
import { dataInstructions } from "./instructions.js";

/**
 * Data Agent Factory
 *
 * Responsible for:
 * - Analyzing datasets (CSV, JSON)
 * - Generating statistics and insights
 * - Creating visualizations
 * - Running ML inference
 *
 * @param tier - Model tier (opus, sonnet, haiku)
 * @returns Configured data agent
 */
export const createData: AgentFactory = createAgentFactory({
  id: "flynn-data",
  name: "Flynn Data",
  description: "Analyzes data, generates statistics, runs ML inference",
  instructions: dataInstructions,
  // Tools will be injected via toolsets or statically assigned
  // See capabilities.yaml: python-data, python-ml
});

/** Default data instance (uses default model tier) */
export const data = createData();

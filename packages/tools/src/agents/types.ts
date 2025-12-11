/**
 * Agent Context Type Definitions
 *
 * Shared types for all agent definitions.
 */

export interface AgentContext {
  id: string;
  name: string;
  description: string;
  instructions: string;
  tools: string[];
  workflow: string[];
  constraints: string[];
  outputFormat: string;
  triggers: string[];
  capabilities: string[];
  /** Recommended model for this agent type */
  recommendedModel?: "haiku" | "sonnet" | "opus";
  /** Rationale for the model recommendation */
  modelRationale?: string;
  /** Estimated tokens for Tier 1 (metadata only) */
  tier1TokenEstimate: number;
  /** Estimated tokens for Tier 2 (full instructions) */
  tier2TokenEstimate: number;
}

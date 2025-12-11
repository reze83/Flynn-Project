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
  /** Abstract tool names (e.g., 'file-ops', 'code-analysis') */
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
  /**
   * Concrete MCP tool IDs recommended for this agent
   * (e.g., 'mcp__serena__read_file', 'mcp__context7__get-library-docs')
   * This is optional and can be computed from the tools array.
   */
  recommendedMcpTools?: string[];
}

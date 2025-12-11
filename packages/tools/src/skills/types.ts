/**
 * Skill Type Definitions
 *
 * Shared types for all skill definitions.
 */

export interface Skill {
  id: string;
  name: string;
  description: string; // Tier 1: ~100 tokens (always loaded)
  instructions: string; // Tier 2: <5k tokens (loaded on activation)
  resources?: string[]; // Tier 3: On-demand external resources
  triggers: string[];
  category: SkillCategory;
  tier1TokenEstimate: number;
  tier2TokenEstimate: number;
}

export type SkillCategory =
  | "development"
  | "devops"
  | "testing"
  | "architecture"
  | "data"
  | "security"
  | "productivity"
  | "ai";

export interface SkillMetadata {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  triggers: string[];
  tier1TokenEstimate: number;
  tier2TokenEstimate: number;
}

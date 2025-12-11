/**
 * Skill Loader - Progressive Disclosure for Token Optimization
 *
 * Implements 3-tier loading pattern:
 * - Tier 1: Metadata only (~100 tokens) - for listing/discovery
 * - Tier 2: Full instructions - for skill activation
 * - Tier 3: External resources - on-demand loading
 */

import {
  SKILL_REGISTRY,
  type Skill,
  type SkillCategory,
  type SkillMetadata,
  detectSkillsForTask,
  getAllSkillMetadata,
  getFullSkill,
  getSkillMetadata,
} from "./skill-registry.js";

export type LoadTier = 1 | 2 | 3;

export interface LoadedSkill {
  tier: LoadTier;
  metadata: SkillMetadata;
  instructions?: string;
  resources?: string[];
  tokensUsed: number;
}

export interface SkillLoadResult {
  success: boolean;
  skill?: LoadedSkill;
  error?: string;
}

export interface SkillListResult {
  skills: SkillMetadata[];
  totalSkills: number;
  categories: SkillCategory[];
  totalTier1Tokens: number;
}

/**
 * Load a skill at the specified tier level
 *
 * @param skillId - The skill identifier
 * @param tier - Loading tier (1=metadata, 2=+instructions, 3=+resources)
 * @returns LoadedSkill with requested tier content
 */
export function loadSkill(skillId: string, tier: LoadTier = 1): SkillLoadResult {
  const fullSkill = getFullSkill(skillId);

  if (!fullSkill) {
    return {
      success: false,
      error: `Skill not found: ${skillId}`,
    };
  }

  const metadata = getSkillMetadata(skillId);

  if (!metadata) {
    return {
      success: false,
      error: `Skill metadata not found: ${skillId}`,
    };
  }

  // Tier 1: Metadata only
  if (tier === 1) {
    return {
      success: true,
      skill: {
        tier: 1,
        metadata,
        tokensUsed: metadata.tier1TokenEstimate,
      },
    };
  }

  // Tier 2: Metadata + Instructions
  if (tier === 2) {
    return {
      success: true,
      skill: {
        tier: 2,
        metadata,
        instructions: fullSkill.instructions,
        tokensUsed: metadata.tier1TokenEstimate + metadata.tier2TokenEstimate,
      },
    };
  }

  // Tier 3: Full content including resources
  return {
    success: true,
    skill: {
      tier: 3,
      metadata,
      instructions: fullSkill.instructions,
      resources: fullSkill.resources,
      tokensUsed: metadata.tier1TokenEstimate + metadata.tier2TokenEstimate + 50, // +50 for resource URLs
    },
  };
}

/**
 * Load multiple skills efficiently
 */
export function loadSkills(
  skillIds: string[],
  tier: LoadTier = 1,
): { skills: LoadedSkill[]; errors: string[]; totalTokens: number } {
  const skills: LoadedSkill[] = [];
  const errors: string[] = [];
  let totalTokens = 0;

  for (const skillId of skillIds) {
    const result = loadSkill(skillId, tier);
    if (result.success && result.skill) {
      skills.push(result.skill);
      totalTokens += result.skill.tokensUsed;
    } else if (result.error) {
      errors.push(result.error);
    }
  }

  return { skills, errors, totalTokens };
}

/**
 * List all available skills (Tier 1 only for efficiency)
 */
export function listAllSkills(): SkillListResult {
  const skills = getAllSkillMetadata();
  const categories = [...new Set(skills.map((s) => s.category))] as SkillCategory[];
  const totalTier1Tokens = skills.reduce((sum, s) => sum + s.tier1TokenEstimate, 0);

  return {
    skills,
    totalSkills: skills.length,
    categories,
    totalTier1Tokens,
  };
}

/**
 * List skills by category
 */
export function listSkillsByCategory(category: SkillCategory): SkillMetadata[] {
  return getAllSkillMetadata().filter((s) => s.category === category);
}

/**
 * Auto-detect and load the best matching skill for a task
 */
export function autoLoadSkillForTask(
  task: string,
  tier: LoadTier = 2,
): SkillLoadResult & { confidence: number } {
  const matches = detectSkillsForTask(task);

  if (matches.length === 0 || !matches[0]) {
    return {
      success: false,
      error: "No matching skills found for task",
      confidence: 0,
    };
  }

  const bestMatch = matches[0];
  const result = loadSkill(bestMatch.skillId, tier);

  return {
    ...result,
    confidence: bestMatch.confidence,
  };
}

// Re-export detectSkillsForTask for use in list-skills
export { detectSkillsForTask };

/**
 * Calculate token savings compared to loading all agent contexts
 *
 * Assumes average agent context is ~2000 tokens
 */
export function calculateTokenSavings(loadedSkills: LoadedSkill[]): {
  tokensUsed: number;
  tokensWithoutOptimization: number;
  tokensSaved: number;
  savingsPercentage: number;
} {
  const tokensUsed = loadedSkills.reduce((sum, s) => sum + s.tokensUsed, 0);
  const tokensWithoutOptimization = loadedSkills.length * 2000; // Assume 2000 tokens per full context
  const tokensSaved = tokensWithoutOptimization - tokensUsed;
  const savingsPercentage =
    tokensWithoutOptimization > 0 ? Math.round((tokensSaved / tokensWithoutOptimization) * 100) : 0;

  return {
    tokensUsed,
    tokensWithoutOptimization,
    tokensSaved,
    savingsPercentage,
  };
}

/**
 * Get skill IDs available for a category
 */
export function getAvailableSkillIds(): string[] {
  return Object.keys(SKILL_REGISTRY);
}

/**
 * Check if a skill exists
 */
export function skillExists(skillId: string): boolean {
  return skillId in SKILL_REGISTRY;
}

// Re-export types for convenience
export type { Skill, SkillMetadata, SkillCategory };

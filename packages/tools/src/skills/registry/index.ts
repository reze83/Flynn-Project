/**
 * Skill Registry - Modular skill definitions
 *
 * Skills follow a 3-tier loading pattern:
 * - Tier 1: Metadata only (~100 tokens) - always loaded
 * - Tier 2: Full instructions (<5k tokens) - loaded on activation
 * - Tier 3: External resources - loaded on demand
 */

// Re-export types
export type { Skill, SkillCategory, SkillMetadata } from "../types.js";

import { AI_SKILLS } from "./ai-skills.js";
import { ARCHITECTURE_SKILLS } from "./architecture-skills.js";
// Import skill groups
import { DEVELOPMENT_SKILLS } from "./development-skills.js";
import { DEVOPS_SKILLS } from "./devops-skills.js";
import { PRODUCTIVITY_SKILLS } from "./productivity-skills.js";
import { SECURITY_SKILLS } from "./security-skills.js";
import { TESTING_SKILLS } from "./testing-skills.js";

// Re-export skill groups
export { AI_SKILLS } from "./ai-skills.js";
export { DEVELOPMENT_SKILLS } from "./development-skills.js";
export { ARCHITECTURE_SKILLS } from "./architecture-skills.js";
export { DEVOPS_SKILLS } from "./devops-skills.js";
export { TESTING_SKILLS } from "./testing-skills.js";
export { PRODUCTIVITY_SKILLS } from "./productivity-skills.js";
export { SECURITY_SKILLS } from "./security-skills.js";

// Re-export individual skills - Development
export {
  typescriptAdvanced,
  pythonPatterns,
  systematicDebugging,
  rootCauseTracing,
  mcpBuilder,
} from "./development-skills.js";
export { apiDesign } from "./architecture-skills.js";
export { kubernetesOps, terraformIac } from "./devops-skills.js";
// Re-export individual skills - Testing
export {
  testingStrategies,
  testDrivenDevelopment,
  verificationBeforeCompletion,
} from "./testing-skills.js";
// Re-export individual skills - Productivity
export {
  brainstorming,
  writingPlans,
  executingPlans,
  dispatchingParallelAgents,
} from "./productivity-skills.js";
// Re-export individual skills - Security
export { defenseInDepth } from "./security-skills.js";
// Re-export individual skills - AI
export { promptEngineering } from "./ai-skills.js";

import type { Skill, SkillCategory, SkillMetadata } from "../types.js";

/**
 * Combined registry of all skills
 */
export const SKILL_REGISTRY: Record<string, Skill> = {
  ...DEVELOPMENT_SKILLS,
  ...ARCHITECTURE_SKILLS,
  ...DEVOPS_SKILLS,
  ...TESTING_SKILLS,
  ...PRODUCTIVITY_SKILLS,
  ...SECURITY_SKILLS,
  ...AI_SKILLS,
};

/**
 * PERFORMANCE: Cache for skill metadata
 * Avoids re-computing metadata on every call to getAllSkillMetadata()
 */
let _metadataCache: SkillMetadata[] | null = null;
let _categoryCache: Map<SkillCategory, string[]> | null = null;

/**
 * Get Tier 1 metadata only (for listing/discovery)
 */
export function getSkillMetadata(skillId: string): SkillMetadata | undefined {
  const skill = SKILL_REGISTRY[skillId];
  if (!skill) return undefined;

  return {
    id: skill.id,
    name: skill.name,
    description: skill.description,
    category: skill.category,
    triggers: skill.triggers,
    tier1TokenEstimate: skill.tier1TokenEstimate,
    tier2TokenEstimate: skill.tier2TokenEstimate,
  };
}

/**
 * Get all skill metadata (Tier 1 only)
 * PERFORMANCE: Results are cached after first call
 */
export function getAllSkillMetadata(): SkillMetadata[] {
  if (_metadataCache) return _metadataCache;

  _metadataCache = Object.values(SKILL_REGISTRY).map((skill) => ({
    id: skill.id,
    name: skill.name,
    description: skill.description,
    category: skill.category,
    triggers: skill.triggers,
    tier1TokenEstimate: skill.tier1TokenEstimate,
    tier2TokenEstimate: skill.tier2TokenEstimate,
  }));

  return _metadataCache;
}

/**
 * Invalidate skill caches (call if skills are dynamically added)
 */
export function invalidateSkillCache(): void {
  _metadataCache = null;
  _categoryCache = null;
}

/**
 * Get full skill content (Tier 1 + Tier 2)
 */
export function getFullSkill(skillId: string): Skill | undefined {
  return SKILL_REGISTRY[skillId];
}

/**
 * Get skill IDs by category
 * PERFORMANCE: Results are cached after first call per category
 */
export function getSkillsByCategory(category: SkillCategory): string[] {
  // Initialize cache if needed
  if (!_categoryCache) {
    _categoryCache = new Map();
  }

  // Return cached result if available
  const cached = _categoryCache.get(category);
  if (cached) return cached;

  // Compute and cache
  const result = Object.values(SKILL_REGISTRY)
    .filter((skill) => skill.category === category)
    .map((skill) => skill.id);

  _categoryCache.set(category, result);
  return result;
}

/**
 * Detect matching skills by task keywords
 */
export function detectSkillsForTask(task: string): { skillId: string; confidence: number }[] {
  const taskLower = task.toLowerCase();
  const matches: { skillId: string; matchCount: number }[] = [];

  for (const skill of Object.values(SKILL_REGISTRY)) {
    let matchCount = 0;
    for (const trigger of skill.triggers) {
      if (taskLower.includes(trigger.toLowerCase())) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      matches.push({ skillId: skill.id, matchCount });
    }
  }

  // Sort by match count, calculate confidence
  return matches
    .sort((a, b) => b.matchCount - a.matchCount)
    .map((m) => ({
      skillId: m.skillId,
      confidence: Math.min(m.matchCount / 3, 1),
    }));
}

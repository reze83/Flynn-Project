/**
 * Skill Registry - Progressive Disclosure Pattern for Token Optimization
 *
 * This file re-exports from the modular registry/ directory for backward compatibility.
 * For new code, prefer importing directly from './registry/index.js'.
 *
 * Skills follow a 3-tier loading pattern:
 * - Tier 1: Metadata only (~100 tokens) - always loaded
 * - Tier 2: Full instructions (<5k tokens) - loaded on activation
 * - Tier 3: External resources - loaded on demand
 *
 * This achieves 70-90% token savings compared to loading all agent contexts.
 */

// Re-export everything from the modular structure
export {
  // Types
  type Skill,
  type SkillCategory,
  type SkillMetadata,
  // Combined registry
  SKILL_REGISTRY,
  // Helper functions
  getSkillMetadata,
  getAllSkillMetadata,
  getFullSkill,
  getSkillsByCategory,
  detectSkillsForTask,
  // Skill groups
  DEVELOPMENT_SKILLS,
  ARCHITECTURE_SKILLS,
  DEVOPS_SKILLS,
  TESTING_SKILLS,
  // Individual skills
  typescriptAdvanced,
  pythonPatterns,
  apiDesign,
  kubernetesOps,
  terraformIac,
  testingStrategies,
} from "./registry/index.js";

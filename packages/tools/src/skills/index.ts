/**
 * Skills System - Progressive Disclosure for Token Optimization
 *
 * Exports:
 * - SKILL_REGISTRY: All skill definitions
 * - getSkillTool: MCP tool for retrieving skills
 * - listSkillsTool: MCP tool for listing skills
 * - Skill loader utilities
 */

// Skill Registry
export {
  SKILL_REGISTRY,
  type Skill,
  type SkillMetadata,
  type SkillCategory,
  getSkillMetadata,
  getAllSkillMetadata,
  getFullSkill,
  getSkillsByCategory,
  detectSkillsForTask,
} from "./skill-registry.js";

// Skill Loader
export {
  loadSkill,
  loadSkills,
  listAllSkills,
  listSkillsByCategory,
  autoLoadSkillForTask,
  calculateTokenSavings,
  getAvailableSkillIds,
  skillExists,
  type LoadTier,
  type LoadedSkill,
  type SkillLoadResult,
  type SkillListResult,
} from "./skill-loader.js";

// MCP Tools
export { getSkillTool } from "./get-skill.js";
export { listSkillsTool } from "./list-skills.js";

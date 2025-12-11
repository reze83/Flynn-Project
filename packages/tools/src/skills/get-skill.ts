/**
 * Get Skill Tool
 *
 * Returns skill content with Progressive Disclosure.
 * Tier 1: Metadata only (~100 tokens)
 * Tier 2: Full instructions (<5k tokens)
 * Tier 3: Including external resources
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { type LoadTier, autoLoadSkillForTask, loadSkill } from "./skill-loader.js";

const inputSchema = z.object({
  skillId: z
    .string()
    .optional()
    .describe("Specific skill ID (e.g., 'typescript-advanced', 'python-patterns')"),
  task: z
    .string()
    .optional()
    .describe("Task description to auto-detect skill (if skillId not provided)"),
  tier: z
    .number()
    .min(1)
    .max(3)
    .optional()
    .default(2)
    .describe("Loading tier: 1=metadata, 2=+instructions, 3=+resources"),
});

const outputSchema = z.object({
  success: z.boolean(),
  skillId: z.string().optional(),
  tier: z.number(),
  confidence: z.number(),
  metadata: z
    .object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      category: z.string(),
      triggers: z.array(z.string()),
      tier1TokenEstimate: z.number(),
      tier2TokenEstimate: z.number(),
    })
    .optional(),
  instructions: z.string().optional(),
  resources: z.array(z.string()).optional(),
  tokensUsed: z.number(),
  error: z.string().optional(),
});

export const getSkillTool = createTool({
  id: "get-skill",
  description:
    "Get skill content with Progressive Disclosure. Use tier=1 for metadata only (fast/cheap), tier=2 for full instructions, tier=3 for including resources.",
  inputSchema,
  outputSchema,
  execute: async (input) => {
    // Handle Mastra's context wrapping
    const data = input as {
      context?: { skillId?: string; task?: string; tier?: number };
      skillId?: string;
      task?: string;
      tier?: number;
    };

    const skillId = data?.context?.skillId || data?.skillId;
    const task = data?.context?.task || data?.task;
    const tier = (data?.context?.tier || data?.tier || 2) as LoadTier;

    // If skillId provided, load directly
    if (skillId) {
      const result = loadSkill(skillId, tier);

      if (!result.success || !result.skill) {
        return {
          success: false,
          tier,
          confidence: 0,
          tokensUsed: 0,
          error: result.error || "Failed to load skill",
        };
      }

      return {
        success: true,
        skillId: result.skill.metadata.id,
        tier: result.skill.tier,
        confidence: 1.0,
        metadata: result.skill.metadata,
        instructions: result.skill.instructions,
        resources: result.skill.resources,
        tokensUsed: result.skill.tokensUsed,
      };
    }

    // If task provided, auto-detect best skill
    if (task) {
      const result = autoLoadSkillForTask(task, tier);

      if (!result.success || !result.skill) {
        return {
          success: false,
          tier,
          confidence: result.confidence,
          tokensUsed: 0,
          error: result.error || "No matching skill found",
        };
      }

      return {
        success: true,
        skillId: result.skill.metadata.id,
        tier: result.skill.tier,
        confidence: result.confidence,
        metadata: result.skill.metadata,
        instructions: result.skill.instructions,
        resources: result.skill.resources,
        tokensUsed: result.skill.tokensUsed,
      };
    }

    // Neither skillId nor task provided
    return {
      success: false,
      tier,
      confidence: 0,
      tokensUsed: 0,
      error: "Either skillId or task must be provided",
    };
  },
});

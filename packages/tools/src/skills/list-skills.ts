/**
 * List Skills Tool
 *
 * Returns available skills with metadata only (Tier 1).
 * Efficient for discovery without loading full instructions.
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  type SkillCategory,
  type SkillMetadata,
  detectSkillsForTask,
  listAllSkills,
  listSkillsByCategory as listByCategory,
} from "./skill-loader.js";

const inputSchema = z.object({
  category: z
    .enum([
      "development",
      "devops",
      "testing",
      "architecture",
      "data",
      "security",
      "productivity",
      "ai",
    ])
    .optional()
    .describe("Filter by category"),
  task: z.string().optional().describe("Task description to find matching skills"),
});

const outputSchema = z.object({
  skills: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      category: z.string(),
      triggers: z.array(z.string()),
      tier1TokenEstimate: z.number(),
      tier2TokenEstimate: z.number(),
      confidence: z.number().optional(),
    }),
  ),
  totalSkills: z.number(),
  categories: z.array(z.string()),
  totalTier1Tokens: z.number(),
  matchedByTask: z.boolean(),
});

export const listSkillsTool = createTool({
  id: "list-skills",
  description:
    "List available skills with metadata only (Tier 1). Can filter by category or find skills matching a task description.",
  inputSchema,
  outputSchema,
  execute: async (input) => {
    // Handle Mastra's context wrapping
    const data = input as {
      context?: { category?: SkillCategory; task?: string };
      category?: SkillCategory;
      task?: string;
    };

    const category = data?.context?.category || data?.category;
    const task = data?.context?.task || data?.task;

    // If task provided, find matching skills
    if (task) {
      const matches = detectSkillsForTask(task);
      const allSkillsResult = listAllSkills();

      const matchedSkills = matches.map((m: { skillId: string; confidence: number }) => {
        const skill = allSkillsResult.skills.find((s: SkillMetadata) => s.id === m.skillId);
        return {
          ...(skill as SkillMetadata),
          confidence: m.confidence,
        };
      });

      return {
        skills: matchedSkills,
        totalSkills: matchedSkills.length,
        categories: [
          ...new Set(matchedSkills.map((s: SkillMetadata & { confidence: number }) => s.category)),
        ] as string[],
        totalTier1Tokens: matchedSkills.reduce(
          (sum: number, s: SkillMetadata) => sum + s.tier1TokenEstimate,
          0,
        ),
        matchedByTask: true,
      };
    }

    // If category provided, filter by category
    if (category) {
      const filteredSkills = listByCategory(category);
      return {
        skills: filteredSkills.map((s: SkillMetadata) => ({ ...s, confidence: undefined })),
        totalSkills: filteredSkills.length,
        categories: [category] as string[],
        totalTier1Tokens: filteredSkills.reduce(
          (sum: number, s: SkillMetadata) => sum + s.tier1TokenEstimate,
          0,
        ),
        matchedByTask: false,
      };
    }

    // Return all skills
    const allSkills = listAllSkills();
    return {
      skills: allSkills.skills.map((s) => ({ ...s, confidence: undefined })),
      totalSkills: allSkills.totalSkills,
      categories: allSkills.categories,
      totalTier1Tokens: allSkills.totalTier1Tokens,
      matchedByTask: false,
    };
  },
});

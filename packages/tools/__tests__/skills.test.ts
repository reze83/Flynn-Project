/**
 * Skills System Tests
 *
 * Tests for skill-registry, skill-loader, get-skill, and list-skills
 */

import { beforeEach, describe, expect, it } from "vitest";
import { getSkillTool } from "../src/skills/get-skill.js";
import { listSkillsTool } from "../src/skills/list-skills.js";
import {
  autoLoadSkillForTask,
  calculateTokenSavings,
  getAvailableSkillIds,
  listAllSkills,
  loadSkill,
  loadSkills,
  skillExists,
} from "../src/skills/skill-loader.js";
import {
  SKILL_REGISTRY,
  detectSkillsForTask,
  getAllSkillMetadata,
  getFullSkill,
  getSkillMetadata,
  getSkillsByCategory,
} from "../src/skills/skill-registry.js";

describe("skill-registry", () => {
  describe("SKILL_REGISTRY", () => {
    it("contains expected skills", () => {
      expect(SKILL_REGISTRY).toHaveProperty("typescript-advanced");
      expect(SKILL_REGISTRY).toHaveProperty("python-patterns");
      expect(SKILL_REGISTRY).toHaveProperty("api-design");
      expect(SKILL_REGISTRY).toHaveProperty("kubernetes-ops");
      expect(SKILL_REGISTRY).toHaveProperty("terraform-iac");
      expect(SKILL_REGISTRY).toHaveProperty("testing-strategies");
    });

    it("each skill has required fields", () => {
      for (const skill of Object.values(SKILL_REGISTRY)) {
        expect(skill).toHaveProperty("id");
        expect(skill).toHaveProperty("name");
        expect(skill).toHaveProperty("description");
        expect(skill).toHaveProperty("instructions");
        expect(skill).toHaveProperty("triggers");
        expect(skill).toHaveProperty("category");
        expect(skill).toHaveProperty("tier1TokenEstimate");
        expect(skill).toHaveProperty("tier2TokenEstimate");
      }
    });
  });

  describe("getSkillMetadata", () => {
    it("returns metadata for existing skill", () => {
      const metadata = getSkillMetadata("typescript-advanced");
      expect(metadata).toBeDefined();
      expect(metadata?.id).toBe("typescript-advanced");
      expect(metadata?.name).toBe("TypeScript Advanced Patterns");
      expect(metadata).not.toHaveProperty("instructions");
    });

    it("returns undefined for non-existent skill", () => {
      const metadata = getSkillMetadata("non-existent");
      expect(metadata).toBeUndefined();
    });
  });

  describe("getAllSkillMetadata", () => {
    it("returns all skills as metadata", () => {
      const allMetadata = getAllSkillMetadata();
      expect(allMetadata.length).toBe(Object.keys(SKILL_REGISTRY).length);
      for (const metadata of allMetadata) {
        expect(metadata).not.toHaveProperty("instructions");
      }
    });
  });

  describe("getFullSkill", () => {
    it("returns full skill with instructions", () => {
      const skill = getFullSkill("typescript-advanced");
      expect(skill).toBeDefined();
      expect(skill?.instructions).toBeDefined();
      expect(skill?.instructions.length).toBeGreaterThan(100);
    });
  });

  describe("getSkillsByCategory", () => {
    it("returns skills for development category", () => {
      const skills = getSkillsByCategory("development");
      expect(skills.length).toBeGreaterThan(0);
      expect(skills).toContain("typescript-advanced");
      expect(skills).toContain("python-patterns");
    });

    it("returns skills for devops category", () => {
      const skills = getSkillsByCategory("devops");
      expect(skills).toContain("kubernetes-ops");
      expect(skills).toContain("terraform-iac");
    });
  });

  describe("detectSkillsForTask", () => {
    it("detects typescript skill for typescript task", () => {
      const matches = detectSkillsForTask("Help me with TypeScript generics");
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0]?.skillId).toBe("typescript-advanced");
    });

    it("detects python skill for python task", () => {
      const matches = detectSkillsForTask("Write a pytest test");
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0]?.skillId).toBe("python-patterns");
    });

    it("returns empty array for unrelated task", () => {
      const matches = detectSkillsForTask("Make me a sandwich");
      expect(matches.length).toBe(0);
    });
  });
});

describe("skill-loader", () => {
  describe("loadSkill", () => {
    it("loads tier 1 (metadata only)", () => {
      const result = loadSkill("typescript-advanced", 1);
      expect(result.success).toBe(true);
      expect(result.skill?.tier).toBe(1);
      expect(result.skill?.metadata).toBeDefined();
      expect(result.skill?.instructions).toBeUndefined();
    });

    it("loads tier 2 (with instructions)", () => {
      const result = loadSkill("typescript-advanced", 2);
      expect(result.success).toBe(true);
      expect(result.skill?.tier).toBe(2);
      expect(result.skill?.instructions).toBeDefined();
    });

    it("loads tier 3 (with resources)", () => {
      const result = loadSkill("typescript-advanced", 3);
      expect(result.success).toBe(true);
      expect(result.skill?.tier).toBe(3);
      expect(result.skill?.resources).toBeDefined();
    });

    it("fails for non-existent skill", () => {
      const result = loadSkill("non-existent", 1);
      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });
  });

  describe("loadSkills", () => {
    it("loads multiple skills", () => {
      const result = loadSkills(["typescript-advanced", "python-patterns"], 1);
      expect(result.skills.length).toBe(2);
      expect(result.errors.length).toBe(0);
    });

    it("reports errors for non-existent skills", () => {
      const result = loadSkills(["typescript-advanced", "non-existent"], 1);
      expect(result.skills.length).toBe(1);
      expect(result.errors.length).toBe(1);
    });
  });

  describe("listAllSkills", () => {
    it("returns all skills with totals", () => {
      const result = listAllSkills();
      expect(result.totalSkills).toBe(Object.keys(SKILL_REGISTRY).length);
      expect(result.categories.length).toBeGreaterThan(0);
      expect(result.totalTier1Tokens).toBeGreaterThan(0);
    });
  });

  describe("autoLoadSkillForTask", () => {
    it("auto-loads skill for typescript task", () => {
      const result = autoLoadSkillForTask("Work with TypeScript types");
      expect(result.success).toBe(true);
      expect(result.skill?.metadata.id).toBe("typescript-advanced");
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("returns no match for unrelated task", () => {
      const result = autoLoadSkillForTask("Make me a sandwich");
      expect(result.success).toBe(false);
      expect(result.confidence).toBe(0);
    });
  });

  describe("calculateTokenSavings", () => {
    it("calculates savings for tier 1 loading", () => {
      const skills = loadSkills(["typescript-advanced", "python-patterns"], 1);
      const savings = calculateTokenSavings(skills.skills);
      expect(savings.savingsPercentage).toBeGreaterThan(90);
    });

    it("calculates lower savings for tier 2 loading", () => {
      const skills = loadSkills(["typescript-advanced"], 2);
      const savings = calculateTokenSavings(skills.skills);
      expect(savings.savingsPercentage).toBeLessThan(
        calculateTokenSavings(loadSkills(["typescript-advanced"], 1).skills).savingsPercentage,
      );
    });
  });

  describe("utility functions", () => {
    it("getAvailableSkillIds returns all skill IDs", () => {
      const ids = getAvailableSkillIds();
      expect(ids).toContain("typescript-advanced");
      expect(ids).toContain("python-patterns");
    });

    it("skillExists returns true for existing skill", () => {
      expect(skillExists("typescript-advanced")).toBe(true);
    });

    it("skillExists returns false for non-existent skill", () => {
      expect(skillExists("non-existent")).toBe(false);
    });
  });
});

describe("get-skill tool", () => {
  it("loads skill by ID", async () => {
    const result = await getSkillTool.execute({
      context: { skillId: "typescript-advanced", tier: 2 },
    });
    expect(result.success).toBe(true);
    expect(result.skillId).toBe("typescript-advanced");
    expect(result.instructions).toBeDefined();
  });

  it("auto-detects skill for task", async () => {
    const result = await getSkillTool.execute({
      context: { task: "Help with Python async patterns", tier: 2 },
    });
    expect(result.success).toBe(true);
    expect(result.skillId).toBe("python-patterns");
  });

  it("fails without skillId or task", async () => {
    const result = await getSkillTool.execute({
      context: {},
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("must be provided");
  });

  it("respects tier parameter", async () => {
    const tier1 = await getSkillTool.execute({
      context: { skillId: "typescript-advanced", tier: 1 },
    });
    const tier2 = await getSkillTool.execute({
      context: { skillId: "typescript-advanced", tier: 2 },
    });

    expect(tier1.instructions).toBeUndefined();
    expect(tier2.instructions).toBeDefined();
  });
});

describe("list-skills tool", () => {
  it("lists all skills", async () => {
    const result = await listSkillsTool.execute({
      context: {},
    });
    expect(result.totalSkills).toBeGreaterThan(0);
    expect(result.categories.length).toBeGreaterThan(0);
    expect(result.matchedByTask).toBe(false);
  });

  it("filters by category", async () => {
    const result = await listSkillsTool.execute({
      context: { category: "devops" },
    });
    expect(result.totalSkills).toBeGreaterThan(0);
    expect(result.categories).toContain("devops");
  });

  it("matches skills by task", async () => {
    const result = await listSkillsTool.execute({
      context: { task: "kubernetes deployment" },
    });
    expect(result.matchedByTask).toBe(true);
    expect(result.skills.some((s: { id: string }) => s.id === "kubernetes-ops")).toBe(true);
  });
});

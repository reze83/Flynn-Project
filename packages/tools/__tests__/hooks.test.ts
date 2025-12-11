/**
 * Hooks System Tests
 *
 * Tests for hook-templates and generate-hooks
 */

import { describe, expect, it } from "vitest";
import { generateHooksTool } from "../src/hooks/generate-hooks.js";
import {
  HOOK_TEMPLATES,
  getAllTemplates,
  getTemplate,
  getTemplateCategories,
  getTemplatesByCategory,
  mergeHookConfigs,
} from "../src/hooks/hook-templates.js";

describe("hook-templates", () => {
  describe("HOOK_TEMPLATES", () => {
    it("contains expected templates", () => {
      expect(HOOK_TEMPLATES).toHaveProperty("auto-format-prettier");
      expect(HOOK_TEMPLATES).toHaveProperty("auto-format-biome");
      expect(HOOK_TEMPLATES).toHaveProperty("block-sensitive-files");
      expect(HOOK_TEMPLATES).toHaveProperty("block-dangerous-commands");
      expect(HOOK_TEMPLATES).toHaveProperty("run-tests-on-change");
      expect(HOOK_TEMPLATES).toHaveProperty("tdd-enforcement");
      expect(HOOK_TEMPLATES).toHaveProperty("session-logging");
    });

    it("each template has required fields", () => {
      for (const template of Object.values(HOOK_TEMPLATES)) {
        expect(template).toHaveProperty("id");
        expect(template).toHaveProperty("name");
        expect(template).toHaveProperty("description");
        expect(template).toHaveProperty("category");
        expect(template).toHaveProperty("events");
        expect(template).toHaveProperty("config");
        expect(template.events.length).toBeGreaterThan(0);
      }
    });

    it("each template has valid hook config", () => {
      for (const template of Object.values(HOOK_TEMPLATES)) {
        expect(template.config).toHaveProperty("hooks");
        for (const event of template.events) {
          expect(template.config.hooks).toHaveProperty(event);
        }
      }
    });
  });

  describe("getAllTemplates", () => {
    it("returns all templates", () => {
      const templates = getAllTemplates();
      expect(templates.length).toBe(Object.keys(HOOK_TEMPLATES).length);
    });
  });

  describe("getTemplate", () => {
    it("returns template by ID", () => {
      const template = getTemplate("auto-format-prettier");
      expect(template).toBeDefined();
      expect(template?.id).toBe("auto-format-prettier");
    });

    it("returns undefined for non-existent template", () => {
      const template = getTemplate("non-existent");
      expect(template).toBeUndefined();
    });
  });

  describe("getTemplatesByCategory", () => {
    it("returns formatting templates", () => {
      const templates = getTemplatesByCategory("formatting");
      expect(templates.length).toBeGreaterThan(0);
      for (const t of templates) {
        expect(t.category).toBe("formatting");
      }
    });

    it("returns security templates", () => {
      const templates = getTemplatesByCategory("security");
      expect(templates.length).toBeGreaterThan(0);
      for (const t of templates) {
        expect(t.category).toBe("security");
      }
    });

    it("returns testing templates", () => {
      const templates = getTemplatesByCategory("testing");
      expect(templates.length).toBeGreaterThan(0);
    });
  });

  describe("getTemplateCategories", () => {
    it("returns all categories", () => {
      const categories = getTemplateCategories();
      expect(categories).toContain("formatting");
      expect(categories).toContain("security");
      expect(categories).toContain("testing");
      expect(categories).toContain("logging");
      expect(categories).toContain("workflow");
    });
  });

  describe("mergeHookConfigs", () => {
    it("merges multiple configs", () => {
      const config1 = getTemplate("auto-format-prettier")?.config;
      const config2 = getTemplate("block-sensitive-files")?.config;

      const merged = mergeHookConfigs([config1, config2]);

      expect(merged.hooks.PostToolUse).toBeDefined();
      expect(merged.hooks.PreToolUse).toBeDefined();
    });

    it("combines hooks for same event", () => {
      const config1 = getTemplate("block-sensitive-files")?.config;
      const config2 = getTemplate("block-dangerous-commands")?.config;

      const merged = mergeHookConfigs([config1, config2]);

      // Both are PreToolUse hooks
      expect(merged.hooks.PreToolUse?.length).toBe(2);
    });
  });
});

describe("generate-hooks tool", () => {
  describe("listOnly mode", () => {
    it("lists all templates", async () => {
      const result = await generateHooksTool.execute({
        context: { listOnly: true },
      });
      expect(result.success).toBe(true);
      expect(result.templates?.length).toBeGreaterThan(0);
      expect(result.config).toBeUndefined();
    });

    it("lists templates by category", async () => {
      const result = await generateHooksTool.execute({
        context: { listOnly: true, category: "security" },
      });
      expect(result.success).toBe(true);
      for (const t of result.templates || []) {
        expect(t.category).toBe("security");
      }
    });
  });

  describe("config generation", () => {
    it("generates config for single template", async () => {
      const result = await generateHooksTool.execute({
        context: { templates: ["auto-format-prettier"] },
      });
      expect(result.success).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.config?.hooks?.PostToolUse).toBeDefined();
    });

    it("generates config for multiple templates", async () => {
      const result = await generateHooksTool.execute({
        context: { templates: ["auto-format-prettier", "block-sensitive-files"] },
      });
      expect(result.success).toBe(true);
      expect(result.config?.hooks?.PostToolUse).toBeDefined();
      expect(result.config?.hooks?.PreToolUse).toBeDefined();
    });

    it("generates config for category", async () => {
      const result = await generateHooksTool.execute({
        context: { category: "security" },
      });
      expect(result.success).toBe(true);
      expect(result.templates?.length).toBeGreaterThan(0);
      expect(result.config?.hooks?.PreToolUse).toBeDefined();
    });

    it("fails for non-existent template", async () => {
      const result = await generateHooksTool.execute({
        context: { templates: ["non-existent"] },
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("fails without templates or category", async () => {
      const result = await generateHooksTool.execute({
        context: {},
      });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("output format", () => {
    it("includes settings path for settings format", async () => {
      const result = await generateHooksTool.execute({
        context: { templates: ["auto-format-prettier"], outputFormat: "settings" },
      });
      expect(result.settingsPath).toBeDefined();
      expect(result.instructions).toBeDefined();
    });

    it("returns raw config for json format", async () => {
      const result = await generateHooksTool.execute({
        context: { templates: ["auto-format-prettier"], outputFormat: "json" },
      });
      expect(result.config).toBeDefined();
      expect(result.settingsPath).toBeUndefined();
    });
  });
});

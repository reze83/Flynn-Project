/**
 * Generate Hooks Tool
 *
 * Generates Claude Code hook configurations from templates.
 * Outputs settings.json format for easy integration.
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  type HookTemplate,
  getAllTemplates,
  getTemplate,
  getTemplatesByCategory,
  mergeHookConfigs,
} from "./hook-templates.js";

const inputSchema = z.object({
  templates: z
    .array(z.string())
    .optional()
    .describe("Template IDs to use (e.g., 'auto-format-prettier', 'block-sensitive-files')"),
  category: z
    .enum(["formatting", "security", "testing", "logging", "workflow"])
    .optional()
    .describe("Generate all templates from a category"),
  listOnly: z
    .boolean()
    .optional()
    .default(false)
    .describe("Only list available templates without generating config"),
  outputFormat: z
    .enum(["json", "settings"])
    .optional()
    .default("settings")
    .describe("Output format: json (raw) or settings (ready for settings.json)"),
});

const outputSchema = z.object({
  success: z.boolean(),
  templates: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        category: z.string(),
        events: z.array(z.string()),
      }),
    )
    .optional(),
  config: z.record(z.string(), z.any()).optional(),
  settingsPath: z.string().optional(),
  instructions: z.string().optional(),
  error: z.string().optional(),
});

export const generateHooksTool = createTool({
  id: "generate-hooks",
  description:
    "Generate Claude Code hook configurations from pre-defined templates. Use listOnly=true to see available templates.",
  inputSchema,
  outputSchema,
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: orchestrates validation, filtering, and formatting in one tool implementation
  execute: async (input) => {
    // Handle Mastra's context wrapping
    const data = input as {
      context?: {
        templates?: string[];
        category?: HookTemplate["category"];
        listOnly?: boolean;
        outputFormat?: "json" | "settings";
      };
      templates?: string[];
      category?: HookTemplate["category"];
      listOnly?: boolean;
      outputFormat?: "json" | "settings";
    };

    const templates = data?.context?.templates || data?.templates;
    const category = data?.context?.category || data?.category;
    const listOnly = data?.context?.listOnly ?? data?.listOnly ?? false;
    const outputFormat = data?.context?.outputFormat || data?.outputFormat || "settings";

    // List only mode
    if (listOnly) {
      let templateList: HookTemplate[];

      if (category) {
        templateList = getTemplatesByCategory(category);
      } else {
        templateList = getAllTemplates();
      }

      return {
        success: true,
        templates: templateList.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category,
          events: t.events,
        })),
        instructions: "Use the template IDs with templates parameter to generate config.",
      };
    }

    // Generate config from templates
    const selectedTemplates: HookTemplate[] = [];

    if (templates && templates.length > 0) {
      for (const templateId of templates) {
        const template = getTemplate(templateId);
        if (template) {
          selectedTemplates.push(template);
        } else {
          return {
            success: false,
            error: `Template not found: ${templateId}`,
          };
        }
      }
    } else if (category) {
      selectedTemplates.push(...getTemplatesByCategory(category));
    } else {
      return {
        success: false,
        error: "Either templates or category must be provided (or use listOnly=true)",
      };
    }

    if (selectedTemplates.length === 0) {
      return {
        success: false,
        error: "No templates selected",
      };
    }

    // Merge all template configs
    const mergedConfig = mergeHookConfigs(selectedTemplates.map((t) => t.config));
    const configForOutput = mergedConfig as unknown as Record<string, unknown>;

    // Format output
    if (outputFormat === "settings") {
      return {
        success: true,
        templates: selectedTemplates.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category,
          events: t.events,
        })),
        config: configForOutput,
        settingsPath: ".claude/settings.local.json",
        instructions: `Add this configuration to your .claude/settings.local.json file:

\`\`\`json
${JSON.stringify(mergedConfig, null, 2)}
\`\`\`

Or merge with existing settings using:
1. Create .claude/settings.local.json if it doesn't exist
2. Add the "hooks" key with the configuration above
3. Restart Claude Code to apply hooks`,
      };
    }

    // Raw JSON output
    return {
      success: true,
      templates: selectedTemplates.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        events: t.events,
      })),
      config: configForOutput,
    };
  },
});

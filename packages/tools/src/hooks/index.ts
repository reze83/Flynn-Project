/**
 * Hooks System - Claude Code Hook Generation
 *
 * Provides pre-defined hook templates and a tool to generate
 * settings.json configurations for Claude Code automation.
 */

// Hook Templates
export {
  HOOK_TEMPLATES,
  getAllTemplates,
  getTemplate,
  getTemplatesByCategory,
  getTemplateCategories,
  mergeHookConfigs,
  type HookEvent,
  type HookCommand,
  type HookConfig,
  type HooksSettings,
  type HookTemplate,
} from "./hook-templates.js";

// MCP Tool
export { generateHooksTool } from "./generate-hooks.js";

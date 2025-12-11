/**
 * Flynn MCP Server - Main entry point
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createLogger } from "@flynn/core";
import {
  // Analytics
  analyticsTool,
  analyzeProjectTool,
  // Codex Integration
  codexDelegateTool,
  codexMdGeneratorTool,
  fileOpsTool,
  // Hooks System
  generateHooksTool,
  getAgentContextTool,
  // Skills System
  getSkillTool,
  gitOpsTool,
  healErrorTool,
  // Health Check
  healthCheckTool,
  initializeMcpRegistry,
  // MCP Registry
  listMcpToolsTool,
  listSkillsTool,
  listWorkflowsTool,
  orchestrateTool,
  shellTool,
  systemInfoTool,
  taskRouterTool,
} from "@flynn/tools";
import { MCPServer } from "@mastra/mcp";
import { z } from "zod";

// Zod schemas for safe JSON parsing
const FlynnConfigSchema = z.object({
  tools: z.array(z.string()).optional(),
});

const ClaudeSettingsSchema = z.object({
  permissions: z
    .object({
      allow: z.array(z.string()).optional(),
    })
    .optional(),
});

const logger = createLogger("server");

/**
 * Load MCP tools from environment variable
 */
function loadToolsFromEnv(): string[] {
  const envTools = process.env.FLYNN_MCP_TOOLS;
  if (envTools) {
    const tools = envTools.split(",").map((t) => t.trim());
    logger.info({ count: tools.length }, "Loaded MCP tools from environment");
    return tools;
  }
  return [];
}

/**
 * Load MCP tools from Flynn config file
 */
function loadToolsFromFlynnConfig(): string[] {
  const flynnConfigPath = join(homedir(), ".flynn", "mcp-tools.json");
  if (!existsSync(flynnConfigPath)) return [];

  try {
    const content = readFileSync(flynnConfigPath, "utf-8");
    const result = FlynnConfigSchema.safeParse(JSON.parse(content));

    if (!result.success) {
      logger.warn({ error: result.error }, "Invalid Flynn config schema");
      return [];
    }

    if (result.data.tools && Array.isArray(result.data.tools)) {
      logger.info({ count: result.data.tools.length }, "Loaded MCP tools from Flynn config");
      return result.data.tools;
    }
  } catch (error) {
    logger.warn({ error }, "Failed to parse Flynn MCP tools config");
  }
  return [];
}

/**
 * Load MCP tools from Claude settings
 */
function loadToolsFromClaudeSettings(): string[] {
  const claudeSettingsPath = join(homedir(), ".claude", "settings.json");
  if (!existsSync(claudeSettingsPath)) return [];

  try {
    const content = readFileSync(claudeSettingsPath, "utf-8");
    const result = ClaudeSettingsSchema.safeParse(JSON.parse(content));

    if (!result.success) {
      logger.warn({ error: result.error }, "Invalid Claude settings schema");
      return [];
    }

    const allowList = result.data.permissions?.allow || [];
    const tools = allowList.filter((t) => t.startsWith("mcp__"));
    if (tools.length > 0) {
      logger.info({ count: tools.length }, "Loaded MCP tools from Claude settings");
    }
    return tools;
  } catch (error) {
    logger.warn({ error }, "Failed to parse Claude settings for MCP tools");
  }
  return [];
}

/**
 * Initialize MCP Registry with known external tools
 * Reads from (in order of precedence):
 * 1. FLYNN_MCP_TOOLS environment variable (comma-separated)
 * 2. ~/.flynn/mcp-tools.json config file
 * 3. ~/.claude/settings.json (extracts from permissions.allow)
 */
/**
 * Initialize MCP Registry with known external tools
 * Reads from (in order of precedence):
 * 1. FLYNN_MCP_TOOLS environment variable (comma-separated)
 * 2. ~/.flynn/mcp-tools.json config file
 * 3. ~/.claude/settings.json (extracts from permissions.allow)
 */
function initializeExternalMcpTools(): void {
  // Try each source in order of precedence
  let toolIds: string[] = [];
  let source = "none";

  const envTools = loadToolsFromEnv();
  if (envTools.length > 0) {
    toolIds = envTools;
    source = "environment";
  } else {
    const configTools = loadToolsFromFlynnConfig();
    if (configTools.length > 0) {
      toolIds = configTools;
      source = "Flynn config";
    } else {
      const claudeTools = loadToolsFromClaudeSettings();
      if (claudeTools.length > 0) {
        toolIds = claudeTools;
        source = "Claude settings";
      }
    }
  }

  if (toolIds.length > 0) {
    initializeMcpRegistry(toolIds);
    logger.info({ tools: toolIds.length, source }, "MCP Registry initialized successfully");
  } else {
    logger.warn(
      {
        hint: "Set FLYNN_MCP_TOOLS env var or create ~/.flynn/mcp-tools.json",
      },
      "No external MCP tools configured - registry is empty",
    );
    // Initialize empty registry to prevent errors
    initializeMcpRegistry([]);
  }
}

// Initialize external MCP tools on startup
initializeExternalMcpTools();

const server = new MCPServer({
  id: "flynn-mcp-server",
  name: "Flynn AI Orchestrator",
  version: "1.0.0",
  description: "Expert system that provides agent contexts to Claude Code",
  tools: {
    // Core Tools
    "analyze-project": analyzeProjectTool,
    "system-info": systemInfoTool,
    "route-task": taskRouterTool,
    "get-agent-context": getAgentContextTool,
    orchestrate: orchestrateTool,
    "list-workflows": listWorkflowsTool,
    "heal-error": healErrorTool,
    "git-ops": gitOpsTool,
    "file-ops": fileOpsTool,
    shell: shellTool,
    // Skills System (Progressive Disclosure)
    "get-skill": getSkillTool,
    "list-skills": listSkillsTool,
    // Hooks System (Automation)
    "generate-hooks": generateHooksTool,
    // Health Check
    "health-check": healthCheckTool,
    // Analytics
    analytics: analyticsTool,
    // MCP Registry - External tool discovery
    "list-mcp-tools": listMcpToolsTool,
    // Codex Integration
    "codex-delegate": codexDelegateTool,
    "codex-md-generator": codexMdGeneratorTool,
  },
});

logger.info("Flynn MCP Server starting...");

// Start the server with stdio transport
server.startStdio().catch((error: Error) => {
  logger.error({ error }, "Server failed to start");
  process.exit(1);
});

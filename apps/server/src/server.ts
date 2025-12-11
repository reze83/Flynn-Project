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

const logger = createLogger("server");

/**
 * Initialize MCP Registry with known external tools
 * Reads from:
 * 1. FLYNN_MCP_TOOLS environment variable (comma-separated)
 * 2. ~/.flynn/mcp-tools.json config file
 * 3. ~/.claude/settings.json (extracts from permissions.allow)
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: multi-source config loading requires sequential checks
function initializeExternalMcpTools(): void {
  let toolIds: string[] = [];

  // 1. From environment variable
  const envTools = process.env.FLYNN_MCP_TOOLS;
  if (envTools) {
    toolIds = envTools.split(",").map((t) => t.trim());
    logger.info({ count: toolIds.length }, "Loaded MCP tools from environment");
  }

  // 2. From Flynn config file
  const flynnConfigPath = join(homedir(), ".flynn", "mcp-tools.json");
  if (toolIds.length === 0 && existsSync(flynnConfigPath)) {
    try {
      const config = JSON.parse(readFileSync(flynnConfigPath, "utf-8")) as { tools?: string[] };
      if (config.tools && Array.isArray(config.tools)) {
        toolIds = config.tools;
        logger.info({ count: toolIds.length }, "Loaded MCP tools from Flynn config");
      }
    } catch {
      logger.warn("Failed to parse Flynn MCP tools config");
    }
  }

  // 3. From Claude settings (extract mcp__ tools from permissions)
  const claudeSettingsPath = join(homedir(), ".claude", "settings.json");
  if (toolIds.length === 0 && existsSync(claudeSettingsPath)) {
    try {
      const settings = JSON.parse(readFileSync(claudeSettingsPath, "utf-8")) as {
        permissions?: { allow?: string[] };
      };
      const allowList = settings?.permissions?.allow || [];
      toolIds = allowList.filter((t) => t.startsWith("mcp__"));
      if (toolIds.length > 0) {
        logger.info({ count: toolIds.length }, "Loaded MCP tools from Claude settings");
      }
    } catch {
      logger.warn("Failed to parse Claude settings for MCP tools");
    }
  }

  // Initialize the registry
  if (toolIds.length > 0) {
    initializeMcpRegistry(toolIds);
    logger.info({ tools: toolIds.length }, "MCP Registry initialized");
  } else {
    logger.debug("No external MCP tools configured");
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

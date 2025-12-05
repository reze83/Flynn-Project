/**
 * Flynn MCP Server - Main entry point
 */

import { MCPServer } from "@mastra/mcp";
import { createLogger } from "@flynn/core";
import { analyzeProjectTool, systemInfoTool } from "@flynn/tools";
// import { orchestrator } from "@flynn/agents";

const logger = createLogger("server");

const server = new MCPServer({
  id: "flynn-mcp-server",
  name: "Flynn AI Orchestrator",
  version: "1.0.0",
  description: "Mastra-powered AI agent orchestrator for development tasks",
  tools: {
    "analyze-project": analyzeProjectTool,
    "system-info": systemInfoTool,
  },
  // agents: {
  //   orchestrator, // Becomes ask_orchestrator
  // },
});

logger.info("Flynn MCP Server starting...");

// Start the server
server.start().catch((error) => {
  logger.error({ error }, "Server failed to start");
  process.exit(1);
});

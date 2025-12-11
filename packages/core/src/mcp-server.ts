/**
 * MCP Server Factory
 *
 * Factory for creating and configuring MCP servers.
 */

import type { Agent } from "@mastra/core/agent";
import type { Tool } from "@mastra/core/tools";
import type { Workflow } from "@mastra/core/workflows";
import { MCPServer } from "@mastra/mcp";
import { createLogger } from "./logger.js";

const logger = createLogger("mcp-server");

export interface MCPServerConfig {
  /** Unique server ID */
  id: string;
  /** Server display name */
  name: string;
  /** Server version */
  version?: string;
  /** Tools to expose (keyed by tool id) */
  tools?: Record<string, Tool>;
  /** Agents to expose as ask_<id> tools */
  agents?: Record<string, Agent>;
  /** Workflows to expose as run_<id> tools */
  workflows?: Record<string, Workflow>;
}

/**
 * Create a configured MCP server
 *
 * Agents are exposed as tools with prefix "ask_" (e.g., "ask_myAgent")
 * Workflows are exposed as tools with prefix "run_" (e.g., "run_myWorkflow")
 *
 * @param config - Server configuration
 * @returns Configured MCP server instance
 */
export function createMCPServer(config: MCPServerConfig): MCPServer {
  const { id, name, version = "1.0.0", tools = {}, agents = {}, workflows = {} } = config;

  logger.info(
    {
      id,
      name,
      version,
      toolCount: Object.keys(tools).length,
      agentCount: Object.keys(agents).length,
    },
    "Creating MCP server",
  );

  const server = new MCPServer({
    id,
    name,
    version,
    tools,
    agents,
    workflows,
  });

  return server;
}

/**
 * Start an MCP server with stdio transport
 *
 * @param server - MCP server instance
 */
export async function startStdioServer(server: MCPServer): Promise<void> {
  logger.info("Starting MCP server with stdio transport");
  await server.startStdio();
}

export { MCPServer };

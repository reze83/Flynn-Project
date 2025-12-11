/**
 * MCP Registry - Dynamic discovery and categorization of external MCP tools
 *
 * This module allows Flynn to be aware of other MCP servers and their capabilities,
 * enabling intelligent tool recommendations in agent contexts and workflows.
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";

/**
 * MCP Tool Categories - Maps tool capabilities to categories
 */
export type McpToolCategory =
  | "search" // Web search, code search
  | "research" // Deep research, analysis
  | "code-analysis" // Symbol navigation, code understanding
  | "documentation" // Library docs, API reference
  | "memory" // Persistent memory, preferences
  | "thinking" // Structured reasoning
  | "file-ops" // File operations
  | "shell" // Command execution
  | "git" // Version control
  | "unknown";

/**
 * Registered MCP Tool
 */
export interface McpTool {
  id: string; // Full tool ID (e.g., "mcp__exa__web_search_exa")
  server: string; // Server name (e.g., "exa")
  name: string; // Tool name (e.g., "web_search_exa")
  category: McpToolCategory;
  description?: string;
}

/**
 * MCP Server Registration
 */
export interface McpServer {
  name: string;
  tools: McpTool[];
  description?: string;
}

/**
 * Tool patterns for auto-categorization
 */
const CATEGORY_PATTERNS: Record<McpToolCategory, RegExp[]> = {
  search: [/search/i, /find/i, /query/i, /lookup/i],
  research: [/research/i, /deep/i, /analyze/i, /crawl/i],
  "code-analysis": [/symbol/i, /reference/i, /definition/i, /overview/i, /pattern/i],
  documentation: [/doc/i, /library/i, /api/i, /resolve.*id/i],
  memory: [/memory/i, /remember/i, /preference/i, /store/i],
  thinking: [/think/i, /reason/i, /sequential/i, /chain/i],
  "file-ops": [/file/i, /read/i, /write/i, /create.*file/i, /list.*dir/i],
  shell: [/shell/i, /command/i, /exec/i, /bash/i],
  git: [/git/i, /commit/i, /branch/i, /diff/i],
  unknown: [],
};

/**
 * Known MCP server descriptions
 */
const SERVER_DESCRIPTIONS: Record<string, string> = {
  flynn: "AI agent orchestration and workflows",
  serena: "Code analysis, symbol navigation, and project memory",
  context7: "Library documentation and API reference lookup",
  exa: "Web search, deep research, and content crawling",
  "sequentialthinking-tools": "Structured step-by-step reasoning with tool recommendations",
  "sequential-thinking": "Structured step-by-step reasoning", // Legacy name
  mem0: "Persistent memory and user preferences",
};

/**
 * Registry of discovered MCP servers and tools
 */
class McpRegistry {
  private servers: Map<string, McpServer> = new Map();
  private toolIndex: Map<string, McpTool> = new Map();
  private categoryIndex: Map<McpToolCategory, McpTool[]> = new Map();

  /**
   * Register tools from a list of tool IDs (e.g., from Claude permissions)
   */
  registerFromToolIds(toolIds: string[]): void {
    const mcpTools = toolIds.filter((id) => id.startsWith("mcp__"));

    for (const toolId of mcpTools) {
      const parts = toolId.split("__");
      if (parts.length >= 3) {
        const server = parts[1] || "unknown";
        const name = parts.slice(2).join("__");

        const tool: McpTool = {
          id: toolId,
          server,
          name,
          category: this.categorize(name),
        };

        this.addTool(server, tool);
      }
    }
  }

  /**
   * Add a tool to the registry
   */
  private addTool(serverName: string, tool: McpTool): void {
    // Add to server
    let server = this.servers.get(serverName);
    if (!server) {
      server = {
        name: serverName,
        tools: [],
        description: SERVER_DESCRIPTIONS[serverName],
      };
      this.servers.set(serverName, server);
    }
    server.tools.push(tool);

    // Add to tool index
    this.toolIndex.set(tool.id, tool);

    // Add to category index
    const categoryTools = this.categoryIndex.get(tool.category) || [];
    categoryTools.push(tool);
    this.categoryIndex.set(tool.category, categoryTools);
  }

  /**
   * Auto-categorize a tool based on its name
   */
  private categorize(toolName: string): McpToolCategory {
    for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(toolName)) {
          return category as McpToolCategory;
        }
      }
    }
    return "unknown";
  }

  /**
   * Get all registered servers
   */
  getServers(): McpServer[] {
    return Array.from(this.servers.values());
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: McpToolCategory): McpTool[] {
    return this.categoryIndex.get(category) || [];
  }

  /**
   * Get tools by server
   */
  getToolsByServer(serverName: string): McpTool[] {
    return this.servers.get(serverName)?.tools || [];
  }

  /**
   * Get recommended tools for a task
   */
  getRecommendedTools(task: string): McpTool[] {
    const lowerTask = task.toLowerCase();
    const recommended: McpTool[] = [];

    // Match task keywords to categories
    const categoryKeywords: Record<McpToolCategory, string[]> = {
      search: ["search", "find", "look up", "google"],
      research: ["research", "investigate", "deep dive", "analyze"],
      "code-analysis": ["code", "symbol", "reference", "definition", "function", "class"],
      documentation: ["docs", "documentation", "api", "library", "how to use"],
      memory: ["remember", "save", "store", "preference", "recall"],
      thinking: ["think", "reason", "step by step", "plan", "complex"],
      "file-ops": ["file", "read", "write", "create"],
      shell: ["run", "execute", "command", "terminal"],
      git: ["git", "commit", "branch", "version"],
      unknown: [],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (lowerTask.includes(keyword)) {
          const tools = this.getToolsByCategory(category as McpToolCategory);
          for (const tool of tools) {
            if (!recommended.includes(tool)) {
              recommended.push(tool);
            }
          }
        }
      }
    }

    return recommended;
  }

  /**
   * Get external tools hint for agent instructions
   */
  getExternalToolsHint(categories: McpToolCategory[]): string {
    const hints: string[] = [];

    for (const category of categories) {
      const tools = this.getToolsByCategory(category);
      if (tools.length > 0) {
        const toolList = tools.map((t) => t.id).join(", ");
        hints.push(`- ${category}: ${toolList}`);
      }
    }

    if (hints.length === 0) {
      return "";
    }

    return `\n\n## Available External MCP Tools\n${hints.join("\n")}`;
  }

  /**
   * Clear the registry
   */
  clear(): void {
    this.servers.clear();
    this.toolIndex.clear();
    this.categoryIndex.clear();
  }

  /**
   * Get summary of registered tools
   */
  getSummary(): { servers: number; tools: number; categories: Record<string, number> } {
    const categories: Record<string, number> = {};
    for (const [category, tools] of this.categoryIndex) {
      categories[category] = tools.length;
    }

    return {
      servers: this.servers.size,
      tools: this.toolIndex.size,
      categories,
    };
  }
}

/**
 * Global registry instance
 */
export const mcpRegistry = new McpRegistry();

/**
 * Initialize registry with known tools
 * Call this at startup with the list of available MCP tools
 */
export function initializeMcpRegistry(toolIds: string[]): void {
  mcpRegistry.clear();
  mcpRegistry.registerFromToolIds(toolIds);
}

/**
 * MCP Tool for listing available external MCP tools
 */
const inputSchema = z.object({
  category: z
    .enum([
      "search",
      "research",
      "code-analysis",
      "documentation",
      "memory",
      "thinking",
      "file-ops",
      "shell",
      "git",
      "all",
    ])
    .optional()
    .default("all")
    .describe("Filter by category"),
  server: z.string().optional().describe("Filter by server name"),
  task: z.string().optional().describe("Get recommendations for a specific task"),
});

const outputSchema = z.object({
  servers: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      toolCount: z.number(),
    }),
  ),
  tools: z.array(
    z.object({
      id: z.string(),
      server: z.string(),
      name: z.string(),
      category: z.string(),
    }),
  ),
  summary: z.object({
    totalServers: z.number(),
    totalTools: z.number(),
    byCategory: z.record(z.string(), z.number()),
  }),
  recommendations: z.array(z.string()).optional(),
});

export const listMcpToolsTool = createTool({
  id: "list-mcp-tools",
  description:
    "List available external MCP tools from other servers. Use to discover what tools are available for tasks like search, research, code analysis, etc.",
  inputSchema,
  outputSchema,
  execute: async (input) => {
    const data = input as {
      context?: { category?: string; server?: string; task?: string };
      category?: string;
      server?: string;
      task?: string;
    };

    const category = data?.context?.category || data?.category || "all";
    const server = data?.context?.server || data?.server;
    const task = data?.context?.task || data?.task;

    let tools: McpTool[] = [];

    // Get tools based on filters
    if (task) {
      tools = mcpRegistry.getRecommendedTools(task);
    } else if (server) {
      tools = mcpRegistry.getToolsByServer(server);
    } else if (category !== "all") {
      tools = mcpRegistry.getToolsByCategory(category as McpToolCategory);
    } else {
      // Get all tools
      for (const srv of mcpRegistry.getServers()) {
        tools.push(...srv.tools);
      }
    }

    // Filter out Flynn's own tools for external listing
    tools = tools.filter((t) => t.server !== "flynn");

    const servers = mcpRegistry
      .getServers()
      .filter((s) => s.name !== "flynn")
      .map((s) => ({
        name: s.name,
        description: s.description,
        toolCount: s.tools.length,
      }));

    const summary = mcpRegistry.getSummary();

    return {
      servers,
      tools: tools.map((t) => ({
        id: t.id,
        server: t.server,
        name: t.name,
        category: t.category,
      })),
      summary: {
        totalServers: summary.servers - 1, // Exclude Flynn
        totalTools: summary.tools - 15, // Exclude Flynn's tools (approx)
        byCategory: summary.categories,
      },
      recommendations: task ? tools.map((t) => t.id) : undefined,
    };
  },
});

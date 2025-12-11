/**
 * MCP Tool Integration Tests
 *
 * Tests for the centralized MCP tool mapping system
 */

import { describe, expect, it } from "vitest";
import { AGENT_CONTEXTS } from "../src/agents";
import {
  AGENT_MCP_CATEGORIES,
  AGENT_MCP_TOOL_MAPPINGS,
  getAgentMcpCategories,
  getAgentsWithMcpTools,
  getRecommendedMcpTools,
  hasRecommendedMcpTools,
} from "../src/agents/mcp-mappings";

describe("MCP Tool Integration", () => {
  describe("getRecommendedMcpTools", () => {
    it("should provide MCP tools for all agents", () => {
      for (const agentId of Object.keys(AGENT_CONTEXTS)) {
        const tools = getRecommendedMcpTools(agentId);
        expect(tools).toBeDefined();
        expect(Array.isArray(tools)).toBe(true);

        // Most agents should have at least some tools
        if (agentId !== "healer") {
          // Healer might have fewer tools
          expect(tools.length).toBeGreaterThan(0);
        }
      }
    });

    it("should return MCP tool IDs starting with mcp__", () => {
      for (const agentId of Object.keys(AGENT_CONTEXTS)) {
        const tools = getRecommendedMcpTools(agentId);
        for (const tool of tools) {
          expect(tool).toMatch(/^mcp__/);
        }
      }
    });

    it("should not have duplicate tools per agent", () => {
      for (const agentId of Object.keys(AGENT_CONTEXTS)) {
        const tools = getRecommendedMcpTools(agentId);
        const unique = new Set(tools);
        expect(tools.length).toBe(unique.size);
      }
    });

    it("should return empty array for unknown agent", () => {
      const tools = getRecommendedMcpTools("unknown-agent-id");
      expect(tools).toEqual([]);
    });
  });

  describe("getAgentMcpCategories", () => {
    it("should provide categories for all agents", () => {
      for (const agentId of Object.keys(AGENT_CONTEXTS)) {
        const categories = getAgentMcpCategories(agentId);
        expect(categories).toBeDefined();
        expect(Array.isArray(categories)).toBe(true);
      }
    });

    it("should return empty array for unknown agent", () => {
      const categories = getAgentMcpCategories("unknown-agent-id");
      expect(categories).toEqual([]);
    });
  });

  describe("hasRecommendedMcpTools", () => {
    it("should return true for agents with tools", () => {
      expect(hasRecommendedMcpTools("coder")).toBe(true);
      expect(hasRecommendedMcpTools("diagnostic")).toBe(true);
      expect(hasRecommendedMcpTools("reviewer")).toBe(true);
    });

    it("should return false for unknown agent", () => {
      expect(hasRecommendedMcpTools("unknown-agent-id")).toBe(false);
    });
  });

  describe("getAgentsWithMcpTools", () => {
    it("should return a non-empty array", () => {
      const agents = getAgentsWithMcpTools();
      expect(agents.length).toBeGreaterThan(0);
    });

    it("should only include agents with tool mappings", () => {
      const agents = getAgentsWithMcpTools();
      for (const agentId of agents) {
        expect(AGENT_MCP_TOOL_MAPPINGS[agentId]).toBeDefined();
        expect(AGENT_MCP_TOOL_MAPPINGS[agentId].length).toBeGreaterThan(0);
      }
    });
  });

  describe("Tool Mapping Consistency", () => {
    it("should have category mapping for every agent with tool mapping", () => {
      for (const agentId of Object.keys(AGENT_MCP_TOOL_MAPPINGS)) {
        expect(AGENT_MCP_CATEGORIES[agentId]).toBeDefined();
      }
    });

    it("should have at least one Flynn tool recommendation per agent", () => {
      for (const agentId of Object.keys(AGENT_MCP_TOOL_MAPPINGS)) {
        const tools = AGENT_MCP_TOOL_MAPPINGS[agentId];
        const hasFlynnTool = tools.some((tool) => tool.startsWith("mcp__flynn__"));
        // Most agents should have at least one Flynn tool
        // Some specialized agents might only use external tools
        if (!["github-manager", "qa-tester", "devops-engineer"].includes(agentId)) {
          expect(hasFlynnTool, `Agent ${agentId} should have at least one Flynn tool`).toBe(true);
        }
      }
    });

    it("should have Serena tools for code-related agents", () => {
      const codeAgents = ["coder", "diagnostic", "refactor", "reviewer", "performance"];

      for (const agentId of codeAgents) {
        const tools = AGENT_MCP_TOOL_MAPPINGS[agentId];
        const hasSerenaTool = tools.some((tool) => tool.startsWith("mcp__serena__"));
        expect(hasSerenaTool).toBe(true);
      }
    });

    it("should have documentation tools for research-heavy agents", () => {
      const researchAgents = [
        "system-architect",
        "documentation-architect",
        "ml-engineer",
        "research-specialist",
      ];

      for (const agentId of researchAgents) {
        const tools = AGENT_MCP_TOOL_MAPPINGS[agentId];
        const hasDocTool =
          tools.includes("mcp__context7__get-library-docs") ||
          tools.includes("mcp__exa__get_code_context_exa");
        expect(hasDocTool).toBe(true);
      }
    });
  });

  describe("Agent Context Integration", () => {
    it("should have all agent IDs from AGENT_CONTEXTS in tool mappings", () => {
      for (const agentId of Object.keys(AGENT_CONTEXTS)) {
        // Every agent should have a tool mapping
        expect(AGENT_MCP_TOOL_MAPPINGS[agentId]).toBeDefined();
      }
    });

    it("should not have orphaned tool mappings", () => {
      for (const agentId of Object.keys(AGENT_MCP_TOOL_MAPPINGS)) {
        // Every tool mapping should correspond to an agent
        expect(AGENT_CONTEXTS[agentId]).toBeDefined();
      }
    });
  });
});

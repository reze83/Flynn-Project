import { beforeEach, describe, expect, it, vi } from "vitest";
import { type MCPServerConfig, createMCPServer, startStdioServer } from "../src/mcp-server.js";

// Mock dependencies
const mockStartStdio = vi.fn().mockResolvedValue(undefined);

vi.mock("@mastra/mcp", () => ({
  MCPServer: vi.fn().mockImplementation((config) => ({
    ...config,
    startStdio: mockStartStdio,
  })),
}));

vi.mock("../src/logger.js", () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

import { MCPServer } from "@mastra/mcp";

describe("mcp-server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createMCPServer", () => {
    const baseConfig: MCPServerConfig = {
      id: "test-server",
      name: "Test MCP Server",
    };

    it("creates an MCPServer instance", () => {
      createMCPServer(baseConfig);
      expect(MCPServer).toHaveBeenCalled();
    });

    it("passes id and name to MCPServer", () => {
      createMCPServer(baseConfig);
      expect(MCPServer).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "test-server",
          name: "Test MCP Server",
        }),
      );
    });

    it("uses default version 1.0.0 when not provided", () => {
      createMCPServer(baseConfig);
      expect(MCPServer).toHaveBeenCalledWith(
        expect.objectContaining({
          version: "1.0.0",
        }),
      );
    });

    it("uses provided version when specified", () => {
      createMCPServer({ ...baseConfig, version: "2.0.0" });
      expect(MCPServer).toHaveBeenCalledWith(
        expect.objectContaining({
          version: "2.0.0",
        }),
      );
    });

    it("passes empty tools object when not provided", () => {
      createMCPServer(baseConfig);
      expect(MCPServer).toHaveBeenCalledWith(
        expect.objectContaining({
          tools: {},
        }),
      );
    });

    it("passes tools when provided", () => {
      const mockTool = { id: "mock-tool", execute: vi.fn() };
      createMCPServer({ ...baseConfig, tools: { mockTool: mockTool as unknown } });
      expect(MCPServer).toHaveBeenCalledWith(
        expect.objectContaining({
          tools: { mockTool },
        }),
      );
    });

    it("passes empty agents object when not provided", () => {
      createMCPServer(baseConfig);
      expect(MCPServer).toHaveBeenCalledWith(
        expect.objectContaining({
          agents: {},
        }),
      );
    });

    it("passes agents when provided", () => {
      const mockAgent = { id: "mock-agent", generate: vi.fn() };
      createMCPServer({ ...baseConfig, agents: { mockAgent: mockAgent as unknown } });
      expect(MCPServer).toHaveBeenCalledWith(
        expect.objectContaining({
          agents: { mockAgent },
        }),
      );
    });

    it("passes empty workflows object when not provided", () => {
      createMCPServer(baseConfig);
      expect(MCPServer).toHaveBeenCalledWith(
        expect.objectContaining({
          workflows: {},
        }),
      );
    });

    it("passes workflows when provided", () => {
      const mockWorkflow = { id: "mock-workflow", execute: vi.fn() };
      createMCPServer({ ...baseConfig, workflows: { mockWorkflow: mockWorkflow as unknown } });
      expect(MCPServer).toHaveBeenCalledWith(
        expect.objectContaining({
          workflows: { mockWorkflow },
        }),
      );
    });

    it("returns the created server instance", () => {
      const server = createMCPServer(baseConfig);
      expect(server).toBeDefined();
      expect(server.id).toBe("test-server");
    });
  });

  describe("startStdioServer", () => {
    it("calls server.startStdio", async () => {
      const mockServer = {
        startStdio: mockStartStdio,
      };

      await startStdioServer(mockServer as unknown as { startStdio: () => Promise<void> });

      expect(mockStartStdio).toHaveBeenCalled();
    });

    it("awaits startStdio completion", async () => {
      const mockServer = {
        startStdio: vi.fn().mockResolvedValue(undefined),
      };

      const result = await startStdioServer(
        mockServer as unknown as { startStdio: () => Promise<void> },
      );

      expect(result).toBeUndefined();
    });

    it("propagates errors from startStdio", async () => {
      const mockError = new Error("Stdio failed");
      const mockServer = {
        startStdio: vi.fn().mockRejectedValue(mockError),
      };

      await expect(
        startStdioServer(mockServer as unknown as { startStdio: () => Promise<void> }),
      ).rejects.toThrow("Stdio failed");
    });
  });

  describe("full integration", () => {
    it("can create and prepare server for start", () => {
      const config: MCPServerConfig = {
        id: "integration-server",
        name: "Integration Test Server",
        version: "1.2.3",
        tools: { testTool: { id: "test", execute: vi.fn() } as unknown },
        agents: { testAgent: { id: "agent", generate: vi.fn() } as unknown },
        workflows: { testWorkflow: { id: "workflow" } as unknown },
      };

      const server = createMCPServer(config);

      expect(server).toBeDefined();
      expect(server.id).toBe("integration-server");
      expect(server.name).toBe("Integration Test Server");
      expect(server.version).toBe("1.2.3");
    });
  });
});

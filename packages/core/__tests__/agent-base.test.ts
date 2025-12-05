import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_MODEL,
  DEFAULT_TIER,
  MODEL_IDS,
  type ModelTier,
  createAgentFactory,
  createFlynnAgent,
  executeAgent,
  getAgentModel,
  getModelForTier,
  streamAgent,
} from "../src/agent-base.js";

// Mock dependencies
vi.mock("@mastra/core/agent", () => ({
  Agent: vi.fn().mockImplementation((config) => ({
    ...config,
    generate: vi.fn().mockResolvedValue({ text: "test response" }),
    stream: vi.fn().mockResolvedValue({ textStream: [] }),
  })),
}));

vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: vi.fn((modelId: string) => ({ provider: "anthropic", modelId })),
}));

vi.mock("../src/logger.js", () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

import { anthropic } from "@ai-sdk/anthropic";
import { Agent } from "@mastra/core/agent";

describe("agent-base", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FLYNN_AGENT_MODEL = undefined;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("MODEL_IDS", () => {
    it("has opus model ID", () => {
      expect(MODEL_IDS.opus).toBe("claude-opus-4-5-20251101");
    });

    it("has sonnet model ID", () => {
      expect(MODEL_IDS.sonnet).toBe("claude-sonnet-4-20250514");
    });

    it("has haiku model ID", () => {
      expect(MODEL_IDS.haiku).toBe("claude-3-5-haiku-20241022");
    });
  });

  describe("DEFAULT_TIER", () => {
    it("is sonnet", () => {
      expect(DEFAULT_TIER).toBe("sonnet");
    });
  });

  describe("DEFAULT_MODEL", () => {
    it("matches sonnet model ID", () => {
      expect(DEFAULT_MODEL).toBe(MODEL_IDS.sonnet);
    });
  });

  describe("getModelForTier", () => {
    it("returns opus model for opus tier", () => {
      getModelForTier("opus");
      expect(anthropic).toHaveBeenCalledWith(MODEL_IDS.opus);
    });

    it("returns sonnet model for sonnet tier", () => {
      getModelForTier("sonnet");
      expect(anthropic).toHaveBeenCalledWith(MODEL_IDS.sonnet);
    });

    it("returns haiku model for haiku tier", () => {
      getModelForTier("haiku");
      expect(anthropic).toHaveBeenCalledWith(MODEL_IDS.haiku);
    });
  });

  describe("getAgentModel", () => {
    it("uses provided tier when specified", () => {
      getAgentModel("opus");
      expect(anthropic).toHaveBeenCalledWith(MODEL_IDS.opus);
    });

    it("uses FLYNN_AGENT_MODEL env var when set and no tier provided", () => {
      process.env.FLYNN_AGENT_MODEL = "custom-model-id";
      getAgentModel();
      expect(anthropic).toHaveBeenCalledWith("custom-model-id");
    });

    it("uses DEFAULT_MODEL when no tier and no env var", () => {
      getAgentModel();
      expect(anthropic).toHaveBeenCalledWith(DEFAULT_MODEL);
    });

    it("prioritizes tier over env var", () => {
      process.env.FLYNN_AGENT_MODEL = "custom-model-id";
      getAgentModel("haiku");
      expect(anthropic).toHaveBeenCalledWith(MODEL_IDS.haiku);
    });
  });

  describe("createFlynnAgent", () => {
    const baseConfig = {
      id: "test-agent",
      name: "Test Agent",
      description: "A test agent",
      instructions: "You are a test agent",
    };

    it("creates an Agent instance", () => {
      createFlynnAgent(baseConfig);
      expect(Agent).toHaveBeenCalled();
    });

    it("passes config to Agent constructor", () => {
      createFlynnAgent(baseConfig);
      expect(Agent).toHaveBeenCalledWith(
        expect.objectContaining({
          id: baseConfig.id,
          name: baseConfig.name,
          description: baseConfig.description,
          instructions: baseConfig.instructions,
        }),
      );
    });

    it("uses default model when no tier specified", () => {
      createFlynnAgent(baseConfig);
      expect(anthropic).toHaveBeenCalledWith(DEFAULT_MODEL);
    });

    it("uses specified tier model", () => {
      createFlynnAgent(baseConfig, "opus");
      expect(anthropic).toHaveBeenCalledWith(MODEL_IDS.opus);
    });

    it("uses custom model from config when provided", () => {
      const customModel = { provider: "custom", modelId: "custom-model" };
      // biome-ignore lint/suspicious/noExplicitAny: test mock
      createFlynnAgent({ ...baseConfig, model: customModel as any });
      // Custom model should be used, not anthropic
      expect(Agent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: customModel,
        }),
      );
    });
  });

  describe("createAgentFactory", () => {
    const baseConfig = {
      id: "factory-agent",
      name: "Factory Agent",
      description: "A factory-created agent",
      instructions: "You are a factory agent",
    };

    it("returns a function", () => {
      const factory = createAgentFactory(baseConfig);
      expect(typeof factory).toBe("function");
    });

    it("factory creates agent with default tier when no tier specified", () => {
      const factory = createAgentFactory(baseConfig);
      factory();
      expect(anthropic).toHaveBeenCalledWith(DEFAULT_MODEL);
    });

    it("factory creates agent with specified tier", () => {
      const factory = createAgentFactory(baseConfig);
      factory("opus");
      expect(anthropic).toHaveBeenCalledWith(MODEL_IDS.opus);
    });

    it("factory can create multiple agents with different tiers", () => {
      const factory = createAgentFactory(baseConfig);

      vi.clearAllMocks();
      factory("haiku");
      expect(anthropic).toHaveBeenCalledWith(MODEL_IDS.haiku);

      vi.clearAllMocks();
      factory("opus");
      expect(anthropic).toHaveBeenCalledWith(MODEL_IDS.opus);
    });
  });

  describe("executeAgent", () => {
    it("calls agent.generate with prompt", async () => {
      const mockAgent = {
        generate: vi.fn().mockResolvedValue({ text: "response" }),
      };

      // biome-ignore lint/suspicious/noExplicitAny: test mock
      await executeAgent(mockAgent as any, "test prompt");

      expect(mockAgent.generate).toHaveBeenCalledWith("test prompt", expect.any(Object));
    });

    it("passes options to agent.generate", async () => {
      const mockAgent = {
        generate: vi.fn().mockResolvedValue({ text: "response" }),
      };

      // biome-ignore lint/suspicious/noExplicitAny: test mock
      await executeAgent(mockAgent as any, "test prompt", {
        resourceId: "custom-resource",
        threadId: "thread-123",
      });

      expect(mockAgent.generate).toHaveBeenCalledWith("test prompt", {
        resourceId: "custom-resource",
        threadId: "thread-123",
        toolsets: undefined,
      });
    });

    it("uses default resourceId when not provided", async () => {
      const mockAgent = {
        generate: vi.fn().mockResolvedValue({ text: "response" }),
      };

      // biome-ignore lint/suspicious/noExplicitAny: test mock
      await executeAgent(mockAgent as any, "test prompt");

      expect(mockAgent.generate).toHaveBeenCalledWith("test prompt", {
        resourceId: "default",
        threadId: undefined,
        toolsets: undefined,
      });
    });
  });

  describe("streamAgent", () => {
    it("calls agent.stream with prompt", async () => {
      const mockAgent = {
        stream: vi.fn().mockResolvedValue({ textStream: [] }),
      };

      // biome-ignore lint/suspicious/noExplicitAny: test mock
      await streamAgent(mockAgent as any, "test prompt");

      expect(mockAgent.stream).toHaveBeenCalledWith("test prompt", expect.any(Object));
    });

    it("passes options to agent.stream", async () => {
      const mockAgent = {
        stream: vi.fn().mockResolvedValue({ textStream: [] }),
      };

      // biome-ignore lint/suspicious/noExplicitAny: test mock
      await streamAgent(mockAgent as any, "test prompt", {
        resourceId: "stream-resource",
        threadId: "stream-thread",
        toolsets: { customTool: {} },
      });

      expect(mockAgent.stream).toHaveBeenCalledWith("test prompt", {
        resourceId: "stream-resource",
        threadId: "stream-thread",
        toolsets: { customTool: {} },
        maxTokens: undefined,
      });
    });

    it("uses default resourceId when not provided", async () => {
      const mockAgent = {
        stream: vi.fn().mockResolvedValue({ textStream: [] }),
      };

      // biome-ignore lint/suspicious/noExplicitAny: test mock
      await streamAgent(mockAgent as any, "test prompt");

      expect(mockAgent.stream).toHaveBeenCalledWith("test prompt", {
        resourceId: "default",
        threadId: undefined,
        toolsets: undefined,
        maxTokens: undefined,
      });
    });
  });
});

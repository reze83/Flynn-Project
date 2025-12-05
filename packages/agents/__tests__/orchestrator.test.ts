import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies before importing
vi.mock("@mastra/core/agent", () => ({
  Agent: vi.fn().mockImplementation((config) => ({
    ...config,
    generate: vi.fn().mockResolvedValue({ text: "response" }),
    stream: vi.fn().mockResolvedValue({ textStream: [] }),
    network: vi.fn().mockReturnValue([]),
  })),
}));

vi.mock("@mastra/memory", () => ({
  Memory: vi.fn().mockImplementation((config) => config),
}));

vi.mock("@mastra/libsql", () => ({
  LibSQLStore: vi.fn().mockImplementation((config) => config),
}));

vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: vi.fn((modelId: string) => ({ provider: "anthropic", modelId })),
}));

vi.mock("@flynn/core", () => ({
  getMemoryDbPath: vi.fn(() => "/tmp/test-memory.db"),
}));

// Mock sub-agents
vi.mock("../src/installer.js", () => ({
  installer: { id: "mock-installer" },
}));
vi.mock("../src/diagnostic.js", () => ({
  diagnostic: { id: "mock-diagnostic" },
}));
vi.mock("../src/scaffolder.js", () => ({
  scaffolder: { id: "mock-scaffolder" },
}));
vi.mock("../src/coder.js", () => ({
  coder: { id: "mock-coder" },
}));
vi.mock("../src/refactor.js", () => ({
  refactor: { id: "mock-refactor" },
}));
vi.mock("../src/release.js", () => ({
  release: { id: "mock-release" },
}));
vi.mock("../src/healer.js", () => ({
  healer: { id: "mock-healer" },
}));
vi.mock("../src/data.js", () => ({
  data: { id: "mock-data" },
}));
vi.mock("../src/instructions.js", () => ({
  orchestratorInstructions: "Test orchestrator instructions",
}));
vi.mock("../src/workflows/index.js", () => ({
  analysisWorkflow: { id: "mock-analysis-workflow" },
  bootstrapWorkflow: { id: "mock-bootstrap-workflow" },
}));

describe("orchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("configuration", () => {
    it("creates an Agent with correct id", async () => {
      const { orchestrator } = await import("../src/orchestrator.js");
      expect(orchestrator.id).toBe("flynn-orchestrator");
    });

    it("creates an Agent with correct name", async () => {
      const { orchestrator } = await import("../src/orchestrator.js");
      expect(orchestrator.name).toBe("Flynn");
    });

    it("configures memory with options", async () => {
      const { orchestrator } = await import("../src/orchestrator.js");
      expect(orchestrator.memory).toBeDefined();
    });

    it("registers sub-agents", async () => {
      const { orchestrator } = await import("../src/orchestrator.js");
      expect(orchestrator.agents).toBeDefined();
      expect(Array.isArray(orchestrator.agents)).toBe(true);
    });

    it("registers workflows", async () => {
      const { orchestrator } = await import("../src/orchestrator.js");
      expect(orchestrator.workflows).toBeDefined();
      expect(orchestrator.workflows).toHaveProperty("analysisWorkflow");
      expect(orchestrator.workflows).toHaveProperty("bootstrapWorkflow");
    });
  });
});

describe("orchestrator exports", () => {
  it("exports generateResponse function", async () => {
    const module = await import("../src/orchestrator.js");
    expect(typeof module.generateResponse).toBe("function");
  });

  it("exports streamResponse function", async () => {
    const module = await import("../src/orchestrator.js");
    expect(typeof module.streamResponse).toBe("function");
  });

  it("exports networkResponse function", async () => {
    const module = await import("../src/orchestrator.js");
    expect(typeof module.networkResponse).toBe("function");
  });

  it("exports orchestrator instance", async () => {
    const module = await import("../src/orchestrator.js");
    expect(module.orchestrator).toBeDefined();
  });
});

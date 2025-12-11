import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock mastra workflow dependencies
vi.mock("@mastra/core/workflows", () => ({
  createWorkflow: vi.fn().mockImplementation((config) => {
    const workflow = {
      ...config,
      // biome-ignore lint/suspicious/noThenProperty: mocking workflow API
      then: vi.fn().mockReturnThis(),
      commit: vi.fn().mockReturnThis(),
    };
    return workflow;
  }),
  createStep: vi.fn().mockImplementation((config) => ({
    id: config.id,
    execute: config.execute,
    inputSchema: config.inputSchema,
    outputSchema: config.outputSchema,
  })),
}));

describe("analysisWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates workflow with correct id", async () => {
    const { analysisWorkflow } = await import("../src/workflows/analysis.js");
    expect(analysisWorkflow).toBeDefined();
    expect(analysisWorkflow.id).toBe("analysis");
  });

  it("creates workflow with description", async () => {
    const { analysisWorkflow } = await import("../src/workflows/analysis.js");
    expect(analysisWorkflow.description).toBeDefined();
    expect(typeof analysisWorkflow.description).toBe("string");
  });

  it("has input and output schemas", async () => {
    const { analysisWorkflow } = await import("../src/workflows/analysis.js");
    expect(analysisWorkflow.inputSchema).toBeDefined();
    expect(analysisWorkflow.outputSchema).toBeDefined();
  });
});

describe("bootstrapWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates workflow with correct id", async () => {
    const { bootstrapWorkflow } = await import("../src/workflows/bootstrap.js");
    expect(bootstrapWorkflow).toBeDefined();
    expect(bootstrapWorkflow.id).toBe("bootstrap");
  });

  it("creates workflow with description", async () => {
    const { bootstrapWorkflow } = await import("../src/workflows/bootstrap.js");
    expect(bootstrapWorkflow.description).toBeDefined();
    expect(typeof bootstrapWorkflow.description).toBe("string");
  });

  it("has input and output schemas", async () => {
    const { bootstrapWorkflow } = await import("../src/workflows/bootstrap.js");
    expect(bootstrapWorkflow.inputSchema).toBeDefined();
    expect(bootstrapWorkflow.outputSchema).toBeDefined();
  });
});

describe("workflow exports", () => {
  it("exports analysisWorkflow", async () => {
    const module = await import("../src/workflows/index.js");
    expect(module.analysisWorkflow).toBeDefined();
  });

  it("exports bootstrapWorkflow", async () => {
    const module = await import("../src/workflows/index.js");
    expect(module.bootstrapWorkflow).toBeDefined();
  });
});

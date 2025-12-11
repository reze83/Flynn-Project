import { describe, expect, it } from "vitest";
import { orchestrateTool } from "../src/orchestrate.js";

describe("orchestrate", () => {
  it("plans new-project workflow", async () => {
    const result = await orchestrateTool.execute({
      context: { task: "scaffold new project from scratch" },
    });
    expect(result.template).toBe("new-project");
    expect(result.agents.length).toBeGreaterThan(1);
    expect(result.agents[0].role).toBe("scaffolder");
  });

  it("plans fix-bug workflow", async () => {
    const result = await orchestrateTool.execute({
      context: { task: "fix the authentication bug" },
    });
    expect(result.template).toBe("fix-bug");
    expect(result.agents.some((a) => a.role === "diagnostic")).toBe(true);
    expect(result.agents.some((a) => a.role === "coder")).toBe(true);
  });

  it("plans add-feature workflow", async () => {
    const result = await orchestrateTool.execute({
      context: { task: "implement user login" },
    });
    expect(result.template).toBe("add-feature");
    expect(result.agents.some((a) => a.role === "coder")).toBe(true);
  });

  it("plans refactor workflow", async () => {
    const result = await orchestrateTool.execute({
      context: { task: "refactor the module" },
    });
    expect(result.template).toBe("refactor");
    expect(result.agents.some((a) => a.role === "refactor")).toBe(true);
  });

  it("plans release workflow", async () => {
    const result = await orchestrateTool.execute({
      context: { task: "release version 2.0" },
    });
    expect(result.template).toBe("release");
    expect(result.agents.some((a) => a.role === "release")).toBe(true);
  });

  it("plans setup workflow", async () => {
    const result = await orchestrateTool.execute({
      context: { task: "setup the development environment" },
    });
    expect(result.template).toBe("setup");
    expect(result.agents.some((a) => a.role === "installer")).toBe(true);
  });

  it("plans data-task workflow", async () => {
    const result = await orchestrateTool.execute({
      context: { task: "analyze the CSV data" },
    });
    expect(result.template).toBe("data-task");
    expect(result.agents.some((a) => a.role === "data")).toBe(true);
  });

  it("plans recover workflow", async () => {
    const result = await orchestrateTool.execute({
      context: { task: "heal and recover the system" },
    });
    expect(result.template).toBe("recover");
    expect(result.agents.some((a) => a.role === "healer")).toBe(true);
  });

  it("plans security-audit workflow", async () => {
    const result = await orchestrateTool.execute({
      context: { task: "scan for security vulnerabilities" },
    });
    expect(result.template).toBe("security-audit");
    expect(result.agents.some((a) => a.role === "security")).toBe(true);
  });

  it("plans code-review workflow", async () => {
    const result = await orchestrateTool.execute({
      context: { task: "review this pull request" },
    });
    expect(result.template).toBe("code-review");
    expect(result.agents.some((a) => a.role === "reviewer")).toBe(true);
  });

  it("plans performance-audit workflow", async () => {
    const result = await orchestrateTool.execute({
      context: { task: "profile and find performance bottlenecks" },
    });
    expect(result.template).toBe("performance-audit");
    expect(result.agents.some((a) => a.role === "performance")).toBe(true);
  });

  it("plans full-review workflow explicitly", async () => {
    const result = await orchestrateTool.execute({
      context: { task: "anything", workflow: "full-review" },
    });
    expect(result.template).toBe("full-review");
    expect(result.agents.some((a) => a.role === "reviewer")).toBe(true);
    expect(result.agents.some((a) => a.role === "security")).toBe(true);
    expect(result.agents.some((a) => a.role === "performance")).toBe(true);
  });

  it("plans secure-release workflow explicitly", async () => {
    const result = await orchestrateTool.execute({
      context: { task: "anything", workflow: "secure-release" },
    });
    expect(result.template).toBe("secure-release");
    expect(result.agents.some((a) => a.role === "security")).toBe(true);
    expect(result.agents.some((a) => a.role === "release")).toBe(true);
  });

  it("returns full agent contexts", async () => {
    const result = await orchestrateTool.execute({
      context: { task: "add new feature" },
    });
    for (const agent of result.agents) {
      expect(agent).toHaveProperty("instructions");
      expect(agent).toHaveProperty("tools");
      expect(agent).toHaveProperty("workflow");
      expect(agent).toHaveProperty("constraints");
    }
  });

  it("identifies parallel groups", async () => {
    const result = await orchestrateTool.execute({
      context: { task: "create new project" },
    });
    expect(result).toHaveProperty("parallelGroups");
    expect(result).toHaveProperty("suggestedFlow");
  });

  it("returns correct totalSteps", async () => {
    const result = await orchestrateTool.execute({
      context: { task: "fix bug" },
    });
    expect(result.totalSteps).toBe(result.agents.length);
  });

  it("respects mode parameter", async () => {
    const result = await orchestrateTool.execute({
      context: { task: "add feature", mode: "sequential" },
    });
    expect(result.suggestedFlow).toBe("sequential");
  });

  describe("explicit workflow selection", () => {
    it("uses explicit workflow parameter over auto-detection", async () => {
      // Task says "implement" (would auto-detect as add-feature)
      // but we explicitly request fix-bug
      const result = await orchestrateTool.execute({
        context: { task: "implement something", workflow: "fix-bug" },
      });
      expect(result.template).toBe("fix-bug");
    });

    it("supports workflow at top level", async () => {
      const result = await orchestrateTool.execute({
        task: "do something",
        workflow: "release",
      } as Parameters<typeof orchestrateTool.execute>[0]);
      expect(result.template).toBe("release");
    });

    it("falls back to auto-detect for invalid workflow", async () => {
      const result = await orchestrateTool.execute({
        context: { task: "fix the bug", workflow: "invalid-workflow" },
      });
      // Should auto-detect fix-bug from task
      expect(result.template).toBe("fix-bug");
    });

    it("allows explicit new-project workflow", async () => {
      const result = await orchestrateTool.execute({
        context: { task: "do stuff", workflow: "new-project" },
      });
      expect(result.template).toBe("new-project");
      expect(result.agents[0].role).toBe("scaffolder");
    });

    it("allows explicit recover workflow", async () => {
      const result = await orchestrateTool.execute({
        context: { task: "something went wrong", workflow: "recover" },
      });
      expect(result.template).toBe("recover");
      expect(result.agents.some((a) => a.role === "healer")).toBe(true);
    });
  });
});

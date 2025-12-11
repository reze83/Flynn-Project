import { describe, expect, it } from "vitest";
import { taskRouterTool } from "../src/task-router.js";

describe("taskRouterTool", () => {
  describe("agent routing", () => {
    it("routes install tasks to installer agent", async () => {
      const result = await taskRouterTool.execute({
        context: { message: "install dependencies" },
      });

      expect(result.agent).toBe("installer");
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("routes npm/pnpm tasks to installer agent", async () => {
      const result = await taskRouterTool.execute({
        context: { message: "run pnpm install" },
      });

      expect(result.agent).toBe("installer");
    });

    it("routes debug tasks to diagnostic agent", async () => {
      const result = await taskRouterTool.execute({
        context: { message: "debug this error" },
      });

      expect(result.agent).toBe("diagnostic");
    });

    it("routes bug fix tasks to diagnostic agent", async () => {
      const result = await taskRouterTool.execute({
        context: { message: "fix this bug in the code" },
      });

      expect(result.agent).toBe("diagnostic");
    });

    it("routes create tasks to scaffolder agent", async () => {
      const result = await taskRouterTool.execute({
        context: { message: "create a new project" },
      });

      expect(result.agent).toBe("scaffolder");
    });

    it("routes scaffold tasks to scaffolder agent", async () => {
      const result = await taskRouterTool.execute({
        context: { message: "scaffold and generate a new project template" },
      });

      expect(result.agent).toBe("scaffolder");
    });

    it("routes implement tasks to coder agent", async () => {
      const result = await taskRouterTool.execute({
        context: { message: "implement a login feature" },
      });

      expect(result.agent).toBe("coder");
    });

    it("routes write code tasks to coder agent", async () => {
      const result = await taskRouterTool.execute({
        context: { message: "write a function to calculate sum" },
      });

      expect(result.agent).toBe("coder");
    });

    it("routes refactor tasks to refactor agent", async () => {
      const result = await taskRouterTool.execute({
        context: { message: "refactor the module" },
      });

      expect(result.agent).toBe("refactor");
    });

    it("routes optimize tasks to refactor agent", async () => {
      const result = await taskRouterTool.execute({
        context: { message: "optimize and improve the algorithm" },
      });

      expect(result.agent).toBe("refactor");
    });

    it("routes release tasks to release agent", async () => {
      const result = await taskRouterTool.execute({
        context: { message: "prepare a release" },
      });

      expect(result.agent).toBe("release");
    });

    it("routes deploy tasks to release agent", async () => {
      const result = await taskRouterTool.execute({
        context: { message: "deploy to production" },
      });

      expect(result.agent).toBe("release");
    });

    it("routes recover tasks to healer agent", async () => {
      const result = await taskRouterTool.execute({
        context: { message: "recover and restore the system" },
      });

      expect(result.agent).toBe("healer");
    });

    it("routes rollback tasks to healer agent", async () => {
      const result = await taskRouterTool.execute({
        context: { message: "rollback and revert the changes" },
      });

      expect(result.agent).toBe("healer");
    });

    it("routes data analysis tasks to data agent", async () => {
      const result = await taskRouterTool.execute({
        context: { message: "analyze this dataset" },
      });

      expect(result.agent).toBe("data");
    });

    it("routes csv/json tasks to data agent", async () => {
      const result = await taskRouterTool.execute({
        context: { message: "parse this csv file" },
      });

      expect(result.agent).toBe("data");
    });
  });

  describe("default behavior", () => {
    it("defaults to coder for unknown tasks", async () => {
      const result = await taskRouterTool.execute({
        context: { message: "do something random" },
      });

      expect(result.agent).toBe("coder");
      expect(result.confidence).toBe(0);
    });

    it("defaults to coder for empty message", async () => {
      const result = await taskRouterTool.execute({
        context: { message: "" },
      });

      expect(result.agent).toBe("coder");
      expect(result.confidence).toBe(0);
    });

    it("handles null-ish message by returning coder", async () => {
      // When message is empty string, defaults to coder
      const result = await taskRouterTool.execute({
        context: { message: "   " },
      });

      expect(result.agent).toBe("coder");
      expect(result.confidence).toBe(0);
    });
  });

  describe("confidence scoring", () => {
    it("has higher confidence with more keyword matches", async () => {
      const singleMatch = await taskRouterTool.execute({
        context: { message: "install" },
      });

      const multiMatch = await taskRouterTool.execute({
        context: { message: "install dependencies with npm" },
      });

      expect(multiMatch.confidence).toBeGreaterThan(singleMatch.confidence);
    });

    it("caps confidence at 1.0", async () => {
      const result = await taskRouterTool.execute({
        context: { message: "install setup dependency dependencies package npm pnpm yarn" },
      });

      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe("output structure", () => {
    it("returns all required fields", async () => {
      const result = await taskRouterTool.execute({
        context: { message: "test task" },
      });

      expect(result).toHaveProperty("agent");
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("reasoning");
      expect(result).toHaveProperty("capabilities");
      expect(result).toHaveProperty("suggestedAction");
    });

    it("capabilities is an array", async () => {
      const result = await taskRouterTool.execute({
        context: { message: "install packages" },
      });

      expect(Array.isArray(result.capabilities)).toBe(true);
      expect(result.capabilities.length).toBeGreaterThan(0);
    });

    it("reasoning includes matched keywords", async () => {
      const result = await taskRouterTool.execute({
        context: { message: "debug the error" },
      });

      expect(result.reasoning).toContain("debug");
    });
  });
});

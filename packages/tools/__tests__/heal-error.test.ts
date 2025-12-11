import { describe, expect, it } from "vitest";
import { healErrorTool } from "../src/heal-error.js";

describe("healErrorTool", () => {
  describe("error categorization", () => {
    it("categorizes file not found errors", async () => {
      const result = await healErrorTool.execute({
        context: { error: "ENOENT: no such file or directory" },
      });

      expect(result.category).toBe("File System");
      expect(result.shouldRetry).toBe(true);
    });

    it("categorizes permission errors", async () => {
      const result = await healErrorTool.execute({
        context: { error: "EACCES: permission denied" },
      });

      expect(result.category).toBe("Permissions");
      expect(result.shouldRetry).toBe(false);
    });

    it("categorizes network errors", async () => {
      const result = await healErrorTool.execute({
        context: { error: "ECONNREFUSED: connection refused" },
      });

      expect(result.category).toBe("Network");
      expect(result.shouldRetry).toBe(true);
    });

    it("categorizes module not found errors", async () => {
      const result = await healErrorTool.execute({
        context: { error: "Cannot find module 'some-package'" },
      });

      expect(result.category).toBe("Dependencies");
      expect(result.shouldRetry).toBe(true);
    });

    it("categorizes syntax errors", async () => {
      const result = await healErrorTool.execute({
        context: { error: "SyntaxError: Unexpected token" },
      });

      expect(result.category).toBe("Code Syntax");
      expect(result.shouldRetry).toBe(false);
    });

    it("categorizes type errors", async () => {
      const result = await healErrorTool.execute({
        context: { error: "TypeError: undefined is not a function" },
      });

      expect(result.category).toBe("Type Error");
      expect(result.shouldRetry).toBe(false);
    });

    it("categorizes timeout errors", async () => {
      const result = await healErrorTool.execute({
        context: { error: "Error: Request timed out" },
      });

      expect(result.category).toBe("Timeout");
      expect(result.shouldRetry).toBe(true);
    });

    it("categorizes git errors", async () => {
      const result = await healErrorTool.execute({
        context: { error: "error: merge conflict in file.ts" },
      });

      expect(result.category).toBe("Git");
      expect(result.shouldRetry).toBe(true);
    });

    it("categorizes build errors", async () => {
      const result = await healErrorTool.execute({
        context: { error: "tsc build failed with errors" },
      });

      expect(result.category).toBe("Build");
      expect(result.shouldRetry).toBe(true);
    });

    it("handles unknown errors", async () => {
      const result = await healErrorTool.execute({
        context: { error: "Something completely random happened" },
      });

      expect(result.category).toBe("Unknown");
      expect(result.shouldRetry).toBe(false);
    });
  });

  describe("retry logic", () => {
    it("allows retries for retryable errors", async () => {
      const result = await healErrorTool.execute({
        context: { error: "ENOENT: no such file", retryCount: 0 },
      });

      expect(result.shouldRetry).toBe(true);
      expect(result.remainingRetries).toBe(3);
    });

    it("decrements remaining retries", async () => {
      const result = await healErrorTool.execute({
        context: { error: "ENOENT: no such file", retryCount: 2 },
      });

      expect(result.shouldRetry).toBe(true);
      expect(result.remainingRetries).toBe(1);
    });

    it("stops retrying after max attempts", async () => {
      const result = await healErrorTool.execute({
        context: { error: "ENOENT: no such file", retryCount: 3 },
      });

      expect(result.shouldRetry).toBe(false);
      expect(result.remainingRetries).toBe(0);
      expect(result.escalate).toBe(true);
    });

    it("never retries non-retryable errors", async () => {
      const result = await healErrorTool.execute({
        context: { error: "SyntaxError: Unexpected token", retryCount: 0 },
      });

      expect(result.shouldRetry).toBe(false);
      expect(result.escalate).toBe(false);
    });
  });

  describe("output structure", () => {
    it("returns all required fields", async () => {
      const result = await healErrorTool.execute({
        context: { error: "test error" },
      });

      expect(result).toHaveProperty("category");
      expect(result).toHaveProperty("diagnosis");
      expect(result).toHaveProperty("strategies");
      expect(result).toHaveProperty("suggestedAction");
      expect(result).toHaveProperty("shouldRetry");
      expect(result).toHaveProperty("maxRetries");
      expect(result).toHaveProperty("remainingRetries");
      expect(result).toHaveProperty("healerInstructions");
      expect(result).toHaveProperty("escalate");
    });

    it("strategies is a non-empty array", async () => {
      const result = await healErrorTool.execute({
        context: { error: "ENOENT: file not found" },
      });

      expect(Array.isArray(result.strategies)).toBe(true);
      expect(result.strategies.length).toBeGreaterThan(0);
    });

    it("suggestedAction is first strategy", async () => {
      const result = await healErrorTool.execute({
        context: { error: "ENOENT: file not found" },
      });

      expect(result.suggestedAction).toBe(result.strategies[0]);
    });

    it("maxRetries is always 3", async () => {
      const result = await healErrorTool.execute({
        context: { error: "any error" },
      });

      expect(result.maxRetries).toBe(3);
    });
  });

  describe("healer instructions", () => {
    it("includes error category in instructions", async () => {
      const result = await healErrorTool.execute({
        context: { error: "ENOENT: no such file" },
      });

      expect(result.healerInstructions).toContain("File System");
    });

    it("includes previous action when provided", async () => {
      const result = await healErrorTool.execute({
        context: {
          error: "ENOENT: no such file",
          previousAction: "reading config.json",
        },
      });

      expect(result.healerInstructions).toContain("reading config.json");
    });

    it("includes retry status for retryable errors", async () => {
      const result = await healErrorTool.execute({
        context: { error: "ENOENT: no such file", retryCount: 1 },
      });

      expect(result.healerInstructions).toContain("retryable");
      expect(result.healerInstructions).toContain("2");
    });

    it("includes escalation notice when max retries exceeded", async () => {
      const result = await healErrorTool.execute({
        context: { error: "ENOENT: no such file", retryCount: 3 },
      });

      expect(result.healerInstructions).toContain("Escalation");
    });
  });

  describe("context handling", () => {
    it("handles error at top level", async () => {
      const result = await healErrorTool.execute({
        error: "ENOENT: no such file",
      } as Parameters<typeof healErrorTool.execute>[0]);

      expect(result.category).toBe("File System");
    });

    it("handles empty error", async () => {
      const result = await healErrorTool.execute({
        context: { error: "" },
      });

      expect(result.category).toBe("Unknown");
    });

    it("includes additional context in diagnosis", async () => {
      const result = await healErrorTool.execute({
        context: {
          error: "ENOENT: no such file",
          context: "while loading user data",
        },
      });

      expect(result.diagnosis).toContain("while loading user data");
    });
  });
});

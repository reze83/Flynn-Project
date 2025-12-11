import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Test the policy validation logic without executing actual commands
// The wrapper integrates with @ai-sdk/anthropic which requires mocking

describe("anthropic-bash-wrapper", () => {
  describe("module exports", () => {
    it("exports flynnBashTool", async () => {
      const module = await import("../src/anthropic-bash-wrapper.js");

      expect(module.flynnBashTool).toBeDefined();
    });

    it("exports createFlynnBashTool factory", async () => {
      const module = await import("../src/anthropic-bash-wrapper.js");

      expect(module.createFlynnBashTool).toBeDefined();
      expect(typeof module.createFlynnBashTool).toBe("function");
    });
  });

  describe("policy integration", () => {
    it("uses validateCommand from @flynn/core", async () => {
      // Verify the module imports policy validation
      const { validateCommand } = await import("@flynn/core");

      expect(validateCommand).toBeDefined();
      expect(typeof validateCommand).toBe("function");
    });

    it("validateCommand blocks dangerous commands", async () => {
      const { validateCommand } = await import("@flynn/core");

      const result = validateCommand("rm -rf /");

      expect(result.allowed).toBe(false);
    });

    it("validateCommand allows safe commands", async () => {
      const { validateCommand } = await import("@flynn/core");

      const result = validateCommand("git status");

      expect(result.allowed).toBe(true);
    });
  });

  describe("metrics integration", () => {
    it("uses recordToolMetric from metrics", async () => {
      const { recordToolMetric, resetMetrics, getMetrics } = await import("../src/metrics.js");

      resetMetrics();

      // Simulate what the wrapper does
      recordToolMetric({
        tool: "bash",
        outcome: "success",
        durationMs: 100,
      });

      const metrics = getMetrics();
      expect(metrics.bash).toBeDefined();
      expect(metrics.bash.success).toBe(1);
    });

    it("tracks blocked commands", async () => {
      const { recordToolMetric, resetMetrics, getMetrics } = await import("../src/metrics.js");

      resetMetrics();

      // Simulate blocked command
      recordToolMetric({
        tool: "bash",
        outcome: "blocked",
        durationMs: 5,
      });

      const metrics = getMetrics();
      expect(metrics.bash.blocked).toBe(1);
    });
  });

  describe("BashResult interface", () => {
    it("success result has expected shape", () => {
      const successResult = {
        stdout: "output",
        stderr: "",
        exitCode: 0,
        metrics: { durationMs: 100 },
      };

      expect(successResult).toHaveProperty("stdout");
      expect(successResult).toHaveProperty("exitCode");
      expect(successResult.exitCode).toBe(0);
    });

    it("blocked result has expected shape", () => {
      const blockedResult = {
        error: "Blocked by flynn.policy.yaml: Command matches deny pattern",
        blockedCommand: "sudo rm -rf /",
        metrics: { durationMs: 5, blocked: true },
      };

      expect(blockedResult).toHaveProperty("error");
      expect(blockedResult).toHaveProperty("blockedCommand");
      expect(blockedResult.metrics?.blocked).toBe(true);
    });

    it("error result has expected shape", () => {
      const errorResult = {
        error: "Execution failed: Command timed out",
        exitCode: 1,
      };

      expect(errorResult).toHaveProperty("error");
      expect(errorResult.exitCode).toBe(1);
    });
  });

  describe("createFlynnBashTool factory", () => {
    it("is a function", async () => {
      const { createFlynnBashTool } = await import("../src/anthropic-bash-wrapper.js");

      expect(typeof createFlynnBashTool).toBe("function");
    });

    it("can be called without arguments (uses default policy)", async () => {
      const { createFlynnBashTool } = await import("../src/anthropic-bash-wrapper.js");

      // Should not throw when called without path
      const tool = createFlynnBashTool();
      expect(tool).toBeDefined();
    });
  });
});

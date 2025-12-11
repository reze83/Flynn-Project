/**
 * Analytics Tool Tests
 */

import { beforeEach, describe, expect, it } from "vitest";
import { analyticsTool } from "../src/analytics.js";

describe("analytics tool", () => {
  beforeEach(async () => {
    // Reset analytics before each test
    await analyticsTool.execute({
      context: { action: "reset" },
    });
  });

  describe("session management", () => {
    it("starts a new session", async () => {
      const result = await analyticsTool.execute({
        context: { action: "start-session" },
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe("start-session");
      expect(result.sessionId).toBeDefined();
      expect(result.sessionId).toMatch(/^flynn-/);
    });

    it("starts a session with custom ID", async () => {
      const result = await analyticsTool.execute({
        context: { action: "start-session", sessionId: "custom-session-123" },
      });

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe("custom-session-123");
    });

    it("ends a session", async () => {
      // Start session first
      const startResult = await analyticsTool.execute({
        context: { action: "start-session" },
      });

      // End session
      const endResult = await analyticsTool.execute({
        context: { action: "end-session" },
      });

      expect(endResult.success).toBe(true);
      expect(endResult.action).toBe("end-session");
      expect(endResult.session).toBeDefined();
      expect(endResult.session?.endedAt).toBeDefined();
    });

    it("fails to end non-existent session", async () => {
      const result = await analyticsTool.execute({
        context: { action: "end-session" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("No active session");
    });

    it("gets session metrics", async () => {
      // Start and record some data
      await analyticsTool.execute({
        context: { action: "start-session", sessionId: "test-session" },
      });

      await analyticsTool.execute({
        context: { action: "record-message", inputTokens: 100, outputTokens: 200 },
      });

      const result = await analyticsTool.execute({
        context: { action: "get-session", sessionId: "test-session" },
      });

      expect(result.success).toBe(true);
      expect(result.session?.totalTokens).toBe(300);
      expect(result.session?.messageCount).toBe(1);
    });
  });

  describe("message recording", () => {
    it("records message tokens", async () => {
      await analyticsTool.execute({
        context: { action: "start-session", sessionId: "msg-test" },
      });

      const result = await analyticsTool.execute({
        context: {
          action: "record-message",
          inputTokens: 500,
          outputTokens: 1000,
          model: "sonnet",
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("1500 tokens");

      // Verify session was updated
      const session = await analyticsTool.execute({
        context: { action: "get-session", sessionId: "msg-test" },
      });

      expect(session.session?.inputTokens).toBe(500);
      expect(session.session?.outputTokens).toBe(1000);
      expect(session.session?.estimatedCost).toBeGreaterThan(0);
    });

    it("auto-starts session when recording message", async () => {
      const result = await analyticsTool.execute({
        context: { action: "record-message", inputTokens: 100, outputTokens: 100 },
      });

      expect(result.success).toBe(true);
      expect(result.sessionId).toBeDefined();
    });
  });

  describe("tool usage recording", () => {
    it("records tool usage", async () => {
      await analyticsTool.execute({
        context: { action: "start-session" },
      });

      const result = await analyticsTool.execute({
        context: {
          action: "record-tool",
          toolName: "file-ops",
          durationMs: 150,
          success: true,
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("file-ops");
    });

    it("fails without tool name", async () => {
      const result = await analyticsTool.execute({
        context: { action: "record-tool", durationMs: 100 },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("toolName is required");
    });

    it("tracks tool statistics", async () => {
      // Record multiple tool usages
      await analyticsTool.execute({
        context: { action: "record-tool", toolName: "git-ops", durationMs: 100, success: true },
      });
      await analyticsTool.execute({
        context: { action: "record-tool", toolName: "git-ops", durationMs: 200, success: true },
      });
      await analyticsTool.execute({
        context: { action: "record-tool", toolName: "file-ops", durationMs: 50, success: false },
      });

      const stats = await analyticsTool.execute({
        context: { action: "get-tool-stats" },
      });

      expect(stats.success).toBe(true);
      expect(stats.toolStats?.length).toBe(2);

      const gitOps = stats.toolStats?.find((t) => t.toolName === "git-ops");
      expect(gitOps?.count).toBe(2);
      expect(gitOps?.avgDuration).toBe(150);
      expect(gitOps?.successRate).toBe(1);

      const fileOps = stats.toolStats?.find((t) => t.toolName === "file-ops");
      expect(fileOps?.count).toBe(1);
      expect(fileOps?.successRate).toBe(0);
    });
  });

  describe("agent usage recording", () => {
    it("records agent usage", async () => {
      await analyticsTool.execute({
        context: { action: "start-session" },
      });

      const result = await analyticsTool.execute({
        context: {
          action: "record-agent",
          agentId: "coder",
          success: true,
          tokenCount: 500,
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("coder");
    });

    it("fails without agent ID", async () => {
      const result = await analyticsTool.execute({
        context: { action: "record-agent", success: true },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("agentId is required");
    });

    it("tracks agent statistics", async () => {
      await analyticsTool.execute({
        context: { action: "record-agent", agentId: "coder", success: true, tokenCount: 100 },
      });
      await analyticsTool.execute({
        context: { action: "record-agent", agentId: "coder", success: true, tokenCount: 200 },
      });
      await analyticsTool.execute({
        context: { action: "record-agent", agentId: "diagnostic", success: false, tokenCount: 50 },
      });

      const stats = await analyticsTool.execute({
        context: { action: "get-agent-stats" },
      });

      expect(stats.success).toBe(true);
      expect(stats.agentStats?.length).toBe(2);

      const coder = stats.agentStats?.find((a) => a.agentId === "coder");
      expect(coder?.count).toBe(2);
      expect(coder?.avgTokens).toBe(150);
      expect(coder?.successRate).toBe(1);
    });
  });

  describe("workflow recording", () => {
    it("records workflow execution", async () => {
      await analyticsTool.execute({
        context: { action: "start-session" },
      });

      const result = await analyticsTool.execute({
        context: {
          action: "record-workflow",
          workflowId: "fix-bug",
          stepsCompleted: 3,
          totalSteps: 3,
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("fix-bug");
    });

    it("fails without workflow ID", async () => {
      const result = await analyticsTool.execute({
        context: { action: "record-workflow" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("workflowId is required");
    });
  });

  describe("summary", () => {
    it("returns usage summary", async () => {
      // Create some sessions with data
      await analyticsTool.execute({
        context: { action: "start-session", sessionId: "s1" },
      });
      await analyticsTool.execute({
        context: { action: "record-message", inputTokens: 1000, outputTokens: 2000 },
      });
      await analyticsTool.execute({
        context: { action: "end-session" },
      });

      await analyticsTool.execute({
        context: { action: "start-session", sessionId: "s2" },
      });
      await analyticsTool.execute({
        context: { action: "record-message", inputTokens: 500, outputTokens: 500 },
      });

      const summary = await analyticsTool.execute({
        context: { action: "get-summary" },
      });

      expect(summary.success).toBe(true);
      expect(summary.summary?.totalSessions).toBe(2);
      expect(summary.summary?.totalTokens).toBe(4000);
      expect(summary.summary?.avgTokensPerSession).toBe(2000);
      expect(summary.summary?.totalCost).toBeGreaterThan(0);
    });
  });

  describe("cost estimation", () => {
    it("calculates cost for sonnet model", async () => {
      await analyticsTool.execute({
        context: { action: "start-session", sessionId: "cost-test" },
      });

      // 1M input tokens = $3, 1M output tokens = $15
      await analyticsTool.execute({
        context: {
          action: "record-message",
          inputTokens: 1000000,
          outputTokens: 1000000,
          model: "sonnet",
        },
      });

      const session = await analyticsTool.execute({
        context: { action: "get-session", sessionId: "cost-test" },
      });

      // $3 + $15 = $18
      expect(session.session?.estimatedCost).toBeCloseTo(18, 1);
    });

    it("calculates cost for haiku model", async () => {
      await analyticsTool.execute({
        context: { action: "start-session", sessionId: "haiku-test" },
      });

      // 1M input tokens = $0.25, 1M output tokens = $1.25
      await analyticsTool.execute({
        context: {
          action: "record-message",
          inputTokens: 1000000,
          outputTokens: 1000000,
          model: "haiku",
        },
      });

      const session = await analyticsTool.execute({
        context: { action: "get-session", sessionId: "haiku-test" },
      });

      // $0.25 + $1.25 = $1.50
      expect(session.session?.estimatedCost).toBeCloseTo(1.5, 1);
    });
  });

  describe("reset", () => {
    it("resets all analytics data", async () => {
      // Add some data
      await analyticsTool.execute({
        context: { action: "start-session" },
      });
      await analyticsTool.execute({
        context: { action: "record-tool", toolName: "test", durationMs: 100 },
      });

      // Reset
      const result = await analyticsTool.execute({
        context: { action: "reset" },
      });

      expect(result.success).toBe(true);

      // Verify data is cleared
      const summary = await analyticsTool.execute({
        context: { action: "get-summary" },
      });

      expect(summary.summary?.totalSessions).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("handles recording with zero tokens", async () => {
      await analyticsTool.execute({
        context: { action: "start-session", sessionId: "zero-test" },
      });

      const result = await analyticsTool.execute({
        context: { action: "record-message", inputTokens: 0, outputTokens: 0 },
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("0 tokens");
    });
  });
});

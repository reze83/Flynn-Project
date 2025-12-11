import { beforeEach, describe, expect, it } from "vitest";
import { getMetrics, recordToolMetric, resetMetrics } from "../src/metrics.js";

describe("metrics", () => {
  beforeEach(() => {
    resetMetrics();
  });

  describe("recordToolMetric", () => {
    it("records a success metric", () => {
      recordToolMetric({ tool: "bash", outcome: "success" });

      const metrics = getMetrics();
      expect(metrics.bash).toBeDefined();
      expect(metrics.bash.success).toBe(1);
      expect(metrics.bash.count).toBe(1);
    });

    it("records a fail metric", () => {
      recordToolMetric({ tool: "bash", outcome: "fail" });

      const metrics = getMetrics();
      expect(metrics.bash.fail).toBe(1);
      expect(metrics.bash.count).toBe(1);
    });

    it("records a blocked metric", () => {
      recordToolMetric({ tool: "bash", outcome: "blocked" });

      const metrics = getMetrics();
      expect(metrics.bash.blocked).toBe(1);
      expect(metrics.bash.count).toBe(1);
    });

    it("tracks duration", () => {
      recordToolMetric({ tool: "bash", outcome: "success", durationMs: 100 });

      const metrics = getMetrics();
      expect(metrics.bash.totalDurationMs).toBe(100);
    });

    it("accumulates multiple calls", () => {
      recordToolMetric({ tool: "bash", outcome: "success", durationMs: 50 });
      recordToolMetric({ tool: "bash", outcome: "success", durationMs: 75 });
      recordToolMetric({ tool: "bash", outcome: "fail", durationMs: 25 });

      const metrics = getMetrics();
      expect(metrics.bash.count).toBe(3);
      expect(metrics.bash.success).toBe(2);
      expect(metrics.bash.fail).toBe(1);
      expect(metrics.bash.totalDurationMs).toBe(150);
    });

    it("tracks multiple tools separately", () => {
      recordToolMetric({ tool: "bash", outcome: "success" });
      recordToolMetric({ tool: "editor", outcome: "success" });
      recordToolMetric({ tool: "bash", outcome: "fail" });

      const metrics = getMetrics();
      expect(metrics.bash.count).toBe(2);
      expect(metrics.editor.count).toBe(1);
    });
  });

  describe("getMetrics", () => {
    it("returns empty object when no metrics recorded", () => {
      const metrics = getMetrics();
      expect(Object.keys(metrics).length).toBe(0);
    });

    it("returns all recorded tools", () => {
      recordToolMetric({ tool: "bash", outcome: "success" });
      recordToolMetric({ tool: "editor", outcome: "success" });
      recordToolMetric({ tool: "file-ops", outcome: "success" });

      const metrics = getMetrics();
      expect(Object.keys(metrics)).toContain("bash");
      expect(Object.keys(metrics)).toContain("editor");
      expect(Object.keys(metrics)).toContain("file-ops");
    });
  });

  describe("resetMetrics", () => {
    it("clears all metrics", () => {
      recordToolMetric({ tool: "bash", outcome: "success" });
      recordToolMetric({ tool: "editor", outcome: "fail" });

      resetMetrics();

      const metrics = getMetrics();
      expect(Object.keys(metrics).length).toBe(0);
    });
  });

  describe("metric structure", () => {
    it("initializes with zero values", () => {
      recordToolMetric({ tool: "new-tool", outcome: "success" });

      const metrics = getMetrics();
      const tool = metrics["new-tool"];

      expect(tool.success).toBe(1);
      expect(tool.fail).toBe(0);
      expect(tool.blocked).toBe(0);
      expect(tool.count).toBe(1);
    });

    it("handles missing duration gracefully", () => {
      recordToolMetric({ tool: "bash", outcome: "success" });

      const metrics = getMetrics();
      expect(metrics.bash.totalDurationMs).toBe(0);
    });
  });
});

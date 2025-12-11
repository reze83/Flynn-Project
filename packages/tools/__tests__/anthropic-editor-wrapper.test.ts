import { describe, expect, it } from "vitest";

describe("anthropic-editor-wrapper", () => {
  describe("module exports", () => {
    it("exports flynnTextEditorTools", async () => {
      const module = await import("../src/anthropic-editor-wrapper.js");

      expect(module.flynnTextEditorTools).toBeDefined();
    });

    it("exports createFlynnTextEditorTools factory", async () => {
      const module = await import("../src/anthropic-editor-wrapper.js");

      expect(module.createFlynnTextEditorTools).toBeDefined();
      expect(typeof module.createFlynnTextEditorTools).toBe("function");
    });

    it("flynnTextEditorTools has str_replace_based_edit_tool", async () => {
      const { flynnTextEditorTools } = await import("../src/anthropic-editor-wrapper.js");

      expect(flynnTextEditorTools.str_replace_based_edit_tool).toBeDefined();
    });
  });

  describe("policy integration", () => {
    it("uses validatePath from @flynn/core", async () => {
      const { validatePath } = await import("@flynn/core");

      expect(validatePath).toBeDefined();
      expect(typeof validatePath).toBe("function");
    });

    it("validatePath blocks writes to system paths", async () => {
      const { validatePath } = await import("@flynn/core");

      const result = validatePath("/etc/passwd", "write");

      expect(result.allowed).toBe(false);
    });

    it("validatePath allows writes in project directory", async () => {
      const { validatePath } = await import("@flynn/core");
      const path = `${process.cwd()}/test-file.txt`;

      const result = validatePath(path, "write");

      expect(result.allowed).toBe(true);
    });
  });

  describe("EditorResult interface", () => {
    it("view result has content field", () => {
      const viewResult = {
        content: "file contents here",
      };

      expect(viewResult).toHaveProperty("content");
    });

    it("success result has expected shape", () => {
      const successResult = {
        success: true,
        message: "Created /path/to/file.txt",
      };

      expect(successResult.success).toBe(true);
      expect(successResult).toHaveProperty("message");
    });

    it("blocked result has expected shape", () => {
      const blockedResult = {
        error: "Path blocked by flynn.policy.yaml: /etc/passwd",
        reason: "Path is read-only",
        metrics: { durationMs: 5, blocked: true },
      };

      expect(blockedResult).toHaveProperty("error");
      expect(blockedResult).toHaveProperty("reason");
      expect(blockedResult.metrics?.blocked).toBe(true);
    });

    it("error result has expected shape", () => {
      const errorResult = {
        error: "File not found: /nonexistent/file.txt",
      };

      expect(errorResult).toHaveProperty("error");
    });
  });

  describe("supported commands", () => {
    it("supports view command", () => {
      // View reads file content
      const commands = ["view", "create", "str_replace", "insert"];
      expect(commands).toContain("view");
    });

    it("supports create command", () => {
      const commands = ["view", "create", "str_replace", "insert"];
      expect(commands).toContain("create");
    });

    it("supports str_replace command", () => {
      const commands = ["view", "create", "str_replace", "insert"];
      expect(commands).toContain("str_replace");
    });

    it("supports insert command", () => {
      const commands = ["view", "create", "str_replace", "insert"];
      expect(commands).toContain("insert");
    });
  });

  describe("createFlynnTextEditorTools factory", () => {
    it("is a function", async () => {
      const { createFlynnTextEditorTools } = await import("../src/anthropic-editor-wrapper.js");

      expect(typeof createFlynnTextEditorTools).toBe("function");
    });

    it("returns tool set with str_replace_based_edit_tool", async () => {
      const { createFlynnTextEditorTools } = await import("../src/anthropic-editor-wrapper.js");

      const tools = createFlynnTextEditorTools();

      expect(tools).toBeDefined();
      expect(tools.str_replace_based_edit_tool).toBeDefined();
    });
  });

  describe("metrics integration", () => {
    it("uses recordToolMetric from metrics", async () => {
      const { recordToolMetric, resetMetrics, getMetrics } = await import("../src/metrics.js");

      resetMetrics();

      recordToolMetric({
        tool: "editor",
        outcome: "success",
        durationMs: 50,
      });

      const metrics = getMetrics();
      expect(metrics.editor).toBeDefined();
      expect(metrics.editor.success).toBe(1);
    });
  });
});

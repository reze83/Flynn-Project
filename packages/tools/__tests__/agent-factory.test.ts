/**
 * Agent Factory Tests
 */

import { describe, expect, it } from "vitest";
import { AgentFactory } from "../src/agents/agent-factory.js";
import { AGENT_CONTEXTS } from "../src/agents/index.js";
import type { AgentContext } from "../src/agents/types.js";

describe("AgentFactory", () => {
  describe("createAgentStep", () => {
    it("should create an agent step with correct structure", () => {
      const coderContext = AGENT_CONTEXTS.coder;
      if (!coderContext) throw new Error("Coder context missing");

      const step = AgentFactory.createAgentStep(coderContext, 1);

      expect(step).toMatchObject({
        id: "coder-1",
        role: "coder",
        subtask: "Step 1: Writes and implements code",
        instructions: expect.stringContaining("Flynn Coder Agent"),
        tools: expect.arrayContaining(["file-ops"]),
        workflow: expect.any(Array),
        constraints: expect.any(Array),
        recommendedMcpTools: expect.any(Array),
      });
    });

    it("should map abstract tools to MCP tools", () => {
      const coderContext = AGENT_CONTEXTS.coder;
      if (!coderContext) throw new Error("Coder context missing");

      const step = AgentFactory.createAgentStep(coderContext, 1);

      // Should contain MCP tool mappings for "file-ops"
      expect(step.recommendedMcpTools).toEqual(
        expect.arrayContaining([
          "mcp__flynn__file-ops",
          "mcp__serena__read_file",
          "mcp__serena__create_text_file",
        ]),
      );
    });

    it("should inject global constraints for optimization agents", () => {
      const refactorContext = AGENT_CONTEXTS.refactor;
      if (!refactorContext) throw new Error("Refactor context missing");

      const step = AgentFactory.createAgentStep(refactorContext, 1);

      // Should have documentation requirement injected
      expect(step.instructions).toContain("Dokumentations-Pflicht");
      expect(step.constraints).toContain(
        "Keine Optimierungsvorschläge ohne Dokumentations-Referenz",
      );
    });

    it("should support custom subtask", () => {
      const coderContext = AGENT_CONTEXTS.coder;
      if (!coderContext) throw new Error("Coder context missing");

      const step = AgentFactory.createAgentStep(coderContext, 1, {
        customSubtask: "Custom task description",
      });

      expect(step.subtask).toBe("Custom task description");
    });

    it("should support additional constraints", () => {
      const coderContext = AGENT_CONTEXTS.coder;
      if (!coderContext) throw new Error("Coder context missing");

      const step = AgentFactory.createAgentStep(coderContext, 1, {
        additionalConstraints: ["No comments", "Use TypeScript"],
      });

      expect(step.constraints).toEqual(expect.arrayContaining(["No comments", "Use TypeScript"]));
    });
  });

  describe("createAgentSteps", () => {
    it("should create multiple agent steps", () => {
      const steps = AgentFactory.createAgentSteps(["coder", "diagnostic"], AGENT_CONTEXTS);

      expect(steps).toHaveLength(2);
      expect(steps[0].id).toBe("coder-1");
      expect(steps[1].id).toBe("diagnostic-2");
    });

    it("should fallback to coder for unknown agents", () => {
      const steps = AgentFactory.createAgentSteps(["unknown-agent"], AGENT_CONTEXTS);

      expect(steps).toHaveLength(1);
      expect(steps[0].role).toBe("coder");
    });
  });

  describe("validateAgentContext", () => {
    it("should validate a well-formed agent context", () => {
      const coderContext = AGENT_CONTEXTS.coder;
      if (!coderContext) throw new Error("Coder context missing");

      const result = AgentFactory.validateAgentContext(coderContext);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect missing required fields", () => {
      const invalidContext: AgentContext = {
        id: "",
        name: "Test",
        description: "",
        instructions: "",
        tools: [],
        workflow: [],
        constraints: [],
        outputFormat: "",
        triggers: [],
        capabilities: [],
        tier1TokenEstimate: 0,
        tier2TokenEstimate: 0,
      };

      const result = AgentFactory.validateAgentContext(invalidContext);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes("missing required field"))).toBe(true);
    });

    it("should detect unmapped tools", () => {
      const contextWithInvalidTools: AgentContext = {
        id: "test",
        name: "Test Agent",
        description: "Test",
        instructions: "Test instructions",
        tools: ["invalid-tool-that-does-not-exist"],
        workflow: ["Step 1"],
        constraints: ["Constraint 1"],
        outputFormat: "JSON",
        triggers: ["test"],
        capabilities: ["Test"],
        tier1TokenEstimate: 100,
        tier2TokenEstimate: 200,
      };

      const result = AgentFactory.validateAgentContext(contextWithInvalidTools);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("unmapped tools"))).toBe(true);
    });
  });

  describe("validateAgentRegistry", () => {
    it("should validate the entire agent registry", () => {
      const result = AgentFactory.validateAgentRegistry(AGENT_CONTEXTS);

      // All agents should be valid
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect ID mismatches", () => {
      const coderContext = AGENT_CONTEXTS.coder;
      if (!coderContext) throw new Error("Coder context not found");
      const invalidRegistry = {
        wrongKey: coderContext,
      };

      const result = AgentFactory.validateAgentRegistry(invalidRegistry);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("does not match context.id"))).toBe(true);
    });
  });
});

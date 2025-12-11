import { describe, expect, it } from "vitest";
import { AGENT_CONTEXTS } from "../src/agent-contexts.js";
import { getAgentContextTool } from "../src/get-agent-context.js";

describe("get-agent-context", () => {
  describe("agent detection", () => {
    it("detects coder for implementation tasks", async () => {
      const result = await getAgentContextTool.execute({
        context: { task: "implement user authentication" },
      });
      expect(result.agent).toBe("coder");
      expect(result.context?.instructions).toContain("Coder");
    });

    it("detects diagnostic for debug tasks", async () => {
      const result = await getAgentContextTool.execute({
        context: { task: "debug failing tests" },
      });
      expect(result.agent).toBe("diagnostic");
    });

    it("detects scaffolder for new project", async () => {
      const result = await getAgentContextTool.execute({
        context: { task: "create new TypeScript project" },
      });
      expect(result.agent).toBe("scaffolder");
    });

    it("detects installer for package tasks", async () => {
      const result = await getAgentContextTool.execute({
        context: { task: "install dependencies" },
      });
      expect(result.agent).toBe("installer");
    });

    it("detects refactor for improvement tasks", async () => {
      const result = await getAgentContextTool.execute({
        context: { task: "refactor the authentication module" },
      });
      expect(result.agent).toBe("refactor");
    });

    it("detects release for version tasks", async () => {
      const result = await getAgentContextTool.execute({
        context: { task: "release version 2.0" },
      });
      expect(result.agent).toBe("release");
    });

    it("detects healer for recovery tasks", async () => {
      const result = await getAgentContextTool.execute({
        context: { task: "heal and recover the system" },
      });
      expect(result.agent).toBe("healer");
    });

    it("detects data for analysis tasks", async () => {
      const result = await getAgentContextTool.execute({
        context: { task: "analyze the CSV data" },
      });
      expect(result.agent).toBe("data");
    });

    it("detects security for vulnerability scanning", async () => {
      const result = await getAgentContextTool.execute({
        context: { task: "scan for security vulnerabilities" },
      });
      expect(result.agent).toBe("security");
    });

    it("detects reviewer for code review tasks", async () => {
      const result = await getAgentContextTool.execute({
        context: { task: "review this pull request" },
      });
      expect(result.agent).toBe("reviewer");
    });

    it("detects performance for optimization tasks", async () => {
      const result = await getAgentContextTool.execute({
        context: { task: "profile and find performance bottlenecks" },
      });
      expect(result.agent).toBe("performance");
    });

    it("allows explicit agent selection", async () => {
      const result = await getAgentContextTool.execute({
        context: { task: "anything", agent: "release" },
      });
      expect(result.agent).toBe("release");
      expect(result.confidence).toBe(1.0);
    });

    it("defaults to coder for unknown tasks", async () => {
      const result = await getAgentContextTool.execute({
        context: { task: "xyzabc random task" },
      });
      expect(result.agent).toBe("coder");
      expect(result.confidence).toBe(0);
    });
  });

  describe("tier-based loading (default tier 2)", () => {
    it("returns full context structure by default (tier 2)", async () => {
      const result = await getAgentContextTool.execute({
        context: { task: "write code" },
      });
      expect(result.tier).toBe(2);
      expect(result.context).toHaveProperty("instructions");
      expect(result.context).toHaveProperty("tools");
      expect(result.context).toHaveProperty("workflow");
      expect(result.context).toHaveProperty("constraints");
      expect(result.context).toHaveProperty("outputFormat");
    });

    it("includes metadata in tier 2 response", async () => {
      const result = await getAgentContextTool.execute({
        context: { task: "write code" },
      });
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.id).toBe("coder");
      expect(result.metadata?.name).toBeDefined();
      expect(result.metadata?.triggers).toBeInstanceOf(Array);
      expect(result.metadata?.capabilities).toBeInstanceOf(Array);
    });

    it("returns tokensUsed for tier 2", async () => {
      const result = await getAgentContextTool.execute({
        context: { task: "write code" },
      });
      expect(result.tokensUsed).toBeGreaterThan(0);
      // Should be tier1 + tier2 estimate
      const ctx = AGENT_CONTEXTS.coder;
      expect(ctx).toBeDefined();
      if (!ctx) return;
      expect(result.tokensUsed).toBe(ctx.tier1TokenEstimate + ctx.tier2TokenEstimate);
    });
  });

  describe("tier 1 (metadata only)", () => {
    it("returns metadata only for tier 1", async () => {
      const result = await getAgentContextTool.execute({
        context: { task: "write code", tier: 1 },
      });
      expect(result.tier).toBe(1);
      expect(result.metadata).toBeDefined();
      expect(result.context).toBeUndefined();
    });

    it("includes correct metadata fields in tier 1", async () => {
      const result = await getAgentContextTool.execute({
        context: { task: "write code", tier: 1 },
      });
      expect(result.metadata?.id).toBe("coder");
      expect(result.metadata?.name).toContain("Flynn");
      expect(result.metadata?.description).toBeDefined();
      expect(result.metadata?.triggers).toBeInstanceOf(Array);
      expect(result.metadata?.capabilities).toBeInstanceOf(Array);
      expect(result.metadata?.recommendedModel).toBeDefined();
    });

    it("returns tier1TokenEstimate for tier 1 tokensUsed", async () => {
      const result = await getAgentContextTool.execute({
        context: { task: "write code", tier: 1 },
      });
      const ctx = AGENT_CONTEXTS.coder;
      expect(ctx).toBeDefined();
      if (!ctx) return;
      expect(result.tokensUsed).toBe(ctx.tier1TokenEstimate);
    });

    it("tier 1 uses significantly fewer tokens than tier 2", async () => {
      const tier1Result = await getAgentContextTool.execute({
        context: { task: "debug error", tier: 1 },
      });
      const tier2Result = await getAgentContextTool.execute({
        context: { task: "debug error", tier: 2 },
      });
      expect(tier1Result.tokensUsed).toBeLessThan(tier2Result.tokensUsed);
      // Tier 1 should be roughly 20-30% of tier 2
      expect(tier1Result.tokensUsed).toBeLessThan(tier2Result.tokensUsed * 0.4);
    });
  });

  describe("tier estimates validation", () => {
    it("all 27 agents have tier estimates", async () => {
      const agentIds = Object.keys(AGENT_CONTEXTS);
      expect(agentIds.length).toBe(27);

      for (const agentId of agentIds) {
        const ctx = AGENT_CONTEXTS[agentId];
        expect(ctx.tier1TokenEstimate).toBeGreaterThan(0);
        expect(ctx.tier2TokenEstimate).toBeGreaterThan(0);
        // Tier 1 should be smaller than tier 2
        expect(ctx.tier1TokenEstimate).toBeLessThan(ctx.tier2TokenEstimate);
      }
    });

    it("tier 1 estimates are in expected range (~100-150 tokens)", async () => {
      for (const ctx of Object.values(AGENT_CONTEXTS)) {
        expect(ctx.tier1TokenEstimate).toBeGreaterThanOrEqual(100);
        expect(ctx.tier1TokenEstimate).toBeLessThanOrEqual(200);
      }
    });

    it("tier 2 estimates are in expected range (~300-700 tokens)", async () => {
      for (const ctx of Object.values(AGENT_CONTEXTS)) {
        expect(ctx.tier2TokenEstimate).toBeGreaterThanOrEqual(300);
        expect(ctx.tier2TokenEstimate).toBeLessThanOrEqual(700);
      }
    });
  });

  describe("backward compatibility", () => {
    it("works without tier parameter (defaults to tier 2)", async () => {
      const result = await getAgentContextTool.execute({
        context: { task: "write code" },
      });
      // Should work exactly like before
      expect(result.agent).toBe("coder");
      expect(result.context).toBeDefined();
      expect(result.context?.instructions).toContain("Coder");
    });
  });
});

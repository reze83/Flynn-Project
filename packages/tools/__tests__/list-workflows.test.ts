import { describe, expect, it } from "vitest";
import { WORKFLOW_DEFINITIONS, listWorkflowsTool } from "../src/list-workflows.js";

describe("listWorkflowsTool", () => {
  describe("returns all workflows", () => {
    it("returns correct number of workflows", async () => {
      const result = await listWorkflowsTool.execute({});

      expect(result.count).toBe(Object.keys(WORKFLOW_DEFINITIONS).length);
      expect(result.workflows.length).toBe(result.count);
    });

    it("includes all expected workflows", async () => {
      const result = await listWorkflowsTool.execute({});
      const workflowIds = result.workflows.map((w) => w.id);

      expect(workflowIds).toContain("new-project");
      expect(workflowIds).toContain("fix-bug");
      expect(workflowIds).toContain("add-feature");
      expect(workflowIds).toContain("refactor");
      expect(workflowIds).toContain("release");
      expect(workflowIds).toContain("setup");
      expect(workflowIds).toContain("analyze");
      expect(workflowIds).toContain("data-task");
      expect(workflowIds).toContain("recover");
      expect(workflowIds).toContain("security-audit");
      expect(workflowIds).toContain("code-review");
      expect(workflowIds).toContain("performance-audit");
      expect(workflowIds).toContain("full-review");
      expect(workflowIds).toContain("secure-release");
    });
  });

  describe("workflow structure", () => {
    it("each workflow has required fields", async () => {
      const result = await listWorkflowsTool.execute({});

      for (const workflow of result.workflows) {
        expect(workflow).toHaveProperty("id");
        expect(workflow).toHaveProperty("name");
        expect(workflow).toHaveProperty("description");
        expect(workflow).toHaveProperty("agents");
        expect(workflow).toHaveProperty("agentNames");
        expect(workflow).toHaveProperty("triggers");
        expect(workflow).toHaveProperty("useCase");
      }
    });

    it("agents is a non-empty array", async () => {
      const result = await listWorkflowsTool.execute({});

      for (const workflow of result.workflows) {
        expect(Array.isArray(workflow.agents)).toBe(true);
        expect(workflow.agents.length).toBeGreaterThan(0);
      }
    });

    it("triggers is a non-empty array", async () => {
      const result = await listWorkflowsTool.execute({});

      for (const workflow of result.workflows) {
        expect(Array.isArray(workflow.triggers)).toBe(true);
        expect(workflow.triggers.length).toBeGreaterThan(0);
      }
    });

    it("agentNames matches agents count", async () => {
      const result = await listWorkflowsTool.execute({});

      for (const workflow of result.workflows) {
        expect(workflow.agentNames.length).toBe(workflow.agents.length);
      }
    });
  });

  describe("specific workflows", () => {
    it("fix-bug has diagnostic-coder-diagnostic pattern", async () => {
      const result = await listWorkflowsTool.execute({});
      const fixBug = result.workflows.find((w) => w.id === "fix-bug");

      expect(fixBug).toBeDefined();
      expect(fixBug?.agents).toEqual(["diagnostic", "coder", "diagnostic"]);
    });

    it("new-project starts with scaffolder", async () => {
      const result = await listWorkflowsTool.execute({});
      const newProject = result.workflows.find((w) => w.id === "new-project");

      expect(newProject).toBeDefined();
      expect(newProject?.agents[0]).toBe("scaffolder");
    });

    it("recover uses healer agent", async () => {
      const result = await listWorkflowsTool.execute({});
      const recover = result.workflows.find((w) => w.id === "recover");

      expect(recover).toBeDefined();
      expect(recover?.agents).toContain("healer");
    });

    it("security-audit uses security agent", async () => {
      const result = await listWorkflowsTool.execute({});
      const securityAudit = result.workflows.find((w) => w.id === "security-audit");

      expect(securityAudit).toBeDefined();
      expect(securityAudit?.agents).toContain("security");
    });

    it("code-review uses reviewer agent", async () => {
      const result = await listWorkflowsTool.execute({});
      const codeReview = result.workflows.find((w) => w.id === "code-review");

      expect(codeReview).toBeDefined();
      expect(codeReview?.agents).toContain("reviewer");
    });

    it("performance-audit uses performance agent", async () => {
      const result = await listWorkflowsTool.execute({});
      const performanceAudit = result.workflows.find((w) => w.id === "performance-audit");

      expect(performanceAudit).toBeDefined();
      expect(performanceAudit?.agents).toContain("performance");
    });

    it("full-review combines reviewer, security, and performance", async () => {
      const result = await listWorkflowsTool.execute({});
      const fullReview = result.workflows.find((w) => w.id === "full-review");

      expect(fullReview).toBeDefined();
      expect(fullReview?.agents).toEqual(["reviewer", "security", "performance"]);
    });

    it("secure-release includes security before release", async () => {
      const result = await listWorkflowsTool.execute({});
      const secureRelease = result.workflows.find((w) => w.id === "secure-release");

      expect(secureRelease).toBeDefined();
      expect(secureRelease?.agents).toEqual(["security", "diagnostic", "release"]);
    });
  });
});

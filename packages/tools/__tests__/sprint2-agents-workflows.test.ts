/**
 * Sprint 2 Tests - New Agents and Workflows
 *
 * Tests for:
 * - 15 new agent contexts
 * - 5 new multi-agent workflows
 * - Hybrid Model Orchestration (recommendedModel)
 */

import { describe, expect, it } from "vitest";
import { AGENT_CONTEXTS, getAgentContext, getAgentIds } from "../src/agent-contexts.js";
import { listWorkflowsTool } from "../src/list-workflows.js";
import { orchestrateTool } from "../src/orchestrate.js";

// ============================================
// NEW AGENTS TESTS
// ============================================

describe("Sprint 2: New Agent Contexts", () => {
  // Architecture Agents
  const architectureAgents = [
    "system-architect",
    "database-architect",
    "frontend-architect",
    "api-designer",
  ];

  // Operations Agents
  const operationsAgents = [
    "devops-engineer",
    "terraform-expert",
    "kubernetes-operator",
    "incident-responder",
  ];

  // Specialized Agents
  const specializedAgents = [
    "migration-specialist",
    "test-architect",
    "documentation-architect",
    "ml-engineer",
    "data-engineer",
    "mobile-developer",
    "blockchain-developer",
  ];

  const allNewAgents = [...architectureAgents, ...operationsAgents, ...specializedAgents];

  describe("Architecture Agents", () => {
    it.each(architectureAgents)("has %s agent defined", (agentId) => {
      const agent = getAgentContext(agentId);
      expect(agent).toBeDefined();
      expect(agent?.id).toBe(agentId);
    });

    it("system-architect has correct properties", () => {
      const agent = getAgentContext("system-architect");
      expect(agent?.name).toBe("Flynn System Architect");
      expect(agent?.triggers).toContain("architecture");
      expect(agent?.triggers).toContain("system design");
      expect(agent?.recommendedModel).toBe("opus");
    });

    it("database-architect handles database triggers", () => {
      const agent = getAgentContext("database-architect");
      expect(agent?.triggers).toContain("schema");
      expect(agent?.triggers).toContain("sql");
      expect(agent?.triggers).toContain("postgres");
    });

    it("frontend-architect handles UI triggers", () => {
      const agent = getAgentContext("frontend-architect");
      expect(agent?.triggers).toContain("react");
      expect(agent?.triggers).toContain("vue");
      expect(agent?.triggers).toContain("component");
    });

    it("api-designer handles API triggers", () => {
      const agent = getAgentContext("api-designer");
      expect(agent?.triggers).toContain("rest");
      expect(agent?.triggers).toContain("graphql");
      expect(agent?.triggers).toContain("openapi");
    });
  });

  describe("Operations Agents", () => {
    it.each(operationsAgents)("has %s agent defined", (agentId) => {
      const agent = getAgentContext(agentId);
      expect(agent).toBeDefined();
      expect(agent?.id).toBe(agentId);
    });

    it("devops-engineer handles CI/CD triggers", () => {
      const agent = getAgentContext("devops-engineer");
      expect(agent?.triggers).toContain("ci");
      expect(agent?.triggers).toContain("pipeline");
      expect(agent?.triggers).toContain("github actions");
    });

    it("terraform-expert handles IaC triggers", () => {
      const agent = getAgentContext("terraform-expert");
      expect(agent?.triggers).toContain("terraform");
      expect(agent?.triggers).toContain("iac");
      expect(agent?.triggers).toContain("aws");
    });

    it("kubernetes-operator handles K8s triggers", () => {
      const agent = getAgentContext("kubernetes-operator");
      expect(agent?.triggers).toContain("kubernetes");
      expect(agent?.triggers).toContain("k8s");
      expect(agent?.triggers).toContain("helm");
    });

    it("incident-responder handles incident triggers", () => {
      const agent = getAgentContext("incident-responder");
      expect(agent?.triggers).toContain("incident");
      expect(agent?.triggers).toContain("outage");
      expect(agent?.triggers).toContain("sev1");
    });
  });

  describe("Specialized Agents", () => {
    it.each(specializedAgents)("has %s agent defined", (agentId) => {
      const agent = getAgentContext(agentId);
      expect(agent).toBeDefined();
      expect(agent?.id).toBe(agentId);
    });

    it("migration-specialist handles migration triggers", () => {
      const agent = getAgentContext("migration-specialist");
      expect(agent?.triggers).toContain("migrate");
      expect(agent?.triggers).toContain("upgrade");
      expect(agent?.triggers).toContain("legacy");
      expect(agent?.recommendedModel).toBe("opus");
    });

    it("ml-engineer handles ML triggers", () => {
      const agent = getAgentContext("ml-engineer");
      expect(agent?.triggers).toContain("machine learning");
      expect(agent?.triggers).toContain("pytorch");
      expect(agent?.triggers).toContain("langchain");
    });

    it("blockchain-developer handles Web3 triggers", () => {
      const agent = getAgentContext("blockchain-developer");
      expect(agent?.triggers).toContain("web3");
      expect(agent?.triggers).toContain("solidity");
      expect(agent?.triggers).toContain("smart contract");
    });
  });

  describe("All New Agents Structure", () => {
    it.each(allNewAgents)("%s has required fields", (agentId) => {
      const agent = getAgentContext(agentId);
      expect(agent).toBeDefined();
      expect(agent?.id).toBe(agentId);
      expect(agent?.name).toBeTruthy();
      expect(agent?.description).toBeTruthy();
      expect(agent?.instructions).toBeTruthy();
      expect(agent?.tools.length).toBeGreaterThan(0);
      expect(agent?.workflow.length).toBeGreaterThan(0);
      expect(agent?.constraints.length).toBeGreaterThan(0);
      expect(agent?.triggers.length).toBeGreaterThan(0);
      expect(agent?.capabilities.length).toBeGreaterThan(0);
    });
  });
});

// ============================================
// HYBRID MODEL ORCHESTRATION TESTS
// ============================================

describe("Sprint 2: Hybrid Model Orchestration", () => {
  it("all agents have recommendedModel field", () => {
    const agentIds = getAgentIds();
    for (const id of agentIds) {
      const agent = getAgentContext(id);
      expect(agent?.recommendedModel).toBeDefined();
      expect(["haiku", "sonnet", "opus"]).toContain(agent?.recommendedModel);
    }
  });

  it("all agents have modelRationale field", () => {
    const agentIds = getAgentIds();
    for (const id of agentIds) {
      const agent = getAgentContext(id);
      expect(agent?.modelRationale).toBeTruthy();
    }
  });

  describe("Model recommendations follow patterns", () => {
    it("execution agents recommend haiku", () => {
      const executionAgents = ["coder", "scaffolder", "installer", "release", "devops-engineer"];
      for (const id of executionAgents) {
        const agent = getAgentContext(id);
        expect(agent?.recommendedModel).toBe("haiku");
      }
    });

    it("analysis agents recommend sonnet", () => {
      const analysisAgents = [
        "diagnostic",
        "refactor",
        "security",
        "reviewer",
        "performance",
        "data",
        "database-architect",
        "frontend-architect",
        "api-designer",
      ];
      for (const id of analysisAgents) {
        const agent = getAgentContext(id);
        expect(agent?.recommendedModel).toBe("sonnet");
      }
    });

    it("planning agents recommend opus", () => {
      const planningAgents = ["system-architect", "migration-specialist"];
      for (const id of planningAgents) {
        const agent = getAgentContext(id);
        expect(agent?.recommendedModel).toBe("opus");
      }
    });
  });
});

// ============================================
// NEW WORKFLOWS TESTS
// ============================================

describe("Sprint 2: New Multi-Agent Workflows", () => {
  const newWorkflows = [
    "full-stack-feature",
    "security-hardening",
    "ml-pipeline",
    "incident-response",
    "codebase-migration",
  ];

  describe("orchestrate tool", () => {
    it.each(newWorkflows)("detects %s workflow", async (workflowId) => {
      const result = await orchestrateTool.execute({
        context: { task: "test task", workflow: workflowId },
      });
      expect(result.template).toBe(workflowId);
      expect(result.agents.length).toBeGreaterThan(0);
    });

    it("full-stack-feature has 7 agents", async () => {
      const result = await orchestrateTool.execute({
        context: { task: "build full stack feature", workflow: "full-stack-feature" },
      });
      expect(result.agents.length).toBe(7);
      expect(result.agents[0].role).toBe("api-designer");
      expect(result.agents[1].role).toBe("database-architect");
      expect(result.agents[6].role).toBe("devops-engineer");
    });

    it("ml-pipeline has correct agent sequence", async () => {
      const result = await orchestrateTool.execute({
        context: { task: "build ml pipeline", workflow: "ml-pipeline" },
      });
      expect(result.agents.length).toBe(5);
      expect(result.agents[0].role).toBe("data-engineer");
      expect(result.agents[1].role).toBe("ml-engineer");
    });

    it("incident-response has recovery flow", async () => {
      const result = await orchestrateTool.execute({
        context: { task: "handle incident", workflow: "incident-response" },
      });
      expect(result.agents.length).toBe(4);
      expect(result.agents[0].role).toBe("diagnostic");
      expect(result.agents[1].role).toBe("incident-responder");
      expect(result.agents[3].role).toBe("healer");
    });

    it("codebase-migration has 6 agents", async () => {
      const result = await orchestrateTool.execute({
        context: { task: "migrate codebase", workflow: "codebase-migration" },
      });
      expect(result.agents.length).toBe(6);
      expect(result.agents[1].role).toBe("migration-specialist");
      expect(result.agents[5].role).toBe("documentation-architect");
    });
  });

  describe("workflow auto-detection", () => {
    it("detects full-stack-feature from task", async () => {
      const result = await orchestrateTool.execute({
        context: { task: "build a full stack end-to-end feature" },
      });
      expect(result.template).toBe("full-stack-feature");
    });

    it("detects ml-pipeline from task", async () => {
      const result = await orchestrateTool.execute({
        context: { task: "build ml pipeline to train model" },
      });
      expect(result.template).toBe("ml-pipeline");
    });

    it("detects incident-response from task", async () => {
      const result = await orchestrateTool.execute({
        context: { task: "handle sev1 incident production down" },
      });
      expect(result.template).toBe("incident-response");
    });

    it("detects codebase-migration from task", async () => {
      const result = await orchestrateTool.execute({
        context: { task: "migrate codebase to new framework version" },
      });
      expect(result.template).toBe("codebase-migration");
    });
  });

  describe("list-workflows tool", () => {
    it("lists all workflows including new ones", async () => {
      const result = await listWorkflowsTool.execute({});
      expect(result.count).toBeGreaterThanOrEqual(19); // 14 original + 5 new

      const workflowIds = result.workflows.map((w: { id: string }) => w.id);
      for (const newWorkflow of newWorkflows) {
        expect(workflowIds).toContain(newWorkflow);
      }
    });

    it("full-stack-feature has correct agent names", async () => {
      const result = await listWorkflowsTool.execute({});
      const fullStack = result.workflows.find((w: { id: string }) => w.id === "full-stack-feature");
      expect(fullStack).toBeDefined();
      expect(fullStack?.agents).toContain("api-designer");
      expect(fullStack?.agents).toContain("database-architect");
      expect(fullStack?.agentNames).toContain("Flynn API Designer");
    });
  });
});

// ============================================
// AGENT COUNT TEST
// ============================================

describe("Total Agent Count", () => {
  it("has 27 agents total (11 original + 16 new)", () => {
    const agentIds = getAgentIds();
    expect(agentIds.length).toBe(27);
  });

  it("has all original agents", () => {
    const originalAgents = [
      "coder",
      "diagnostic",
      "scaffolder",
      "installer",
      "refactor",
      "release",
      "healer",
      "data",
      "security",
      "reviewer",
      "performance",
    ];
    for (const id of originalAgents) {
      expect(getAgentContext(id)).toBeDefined();
    }
  });
});

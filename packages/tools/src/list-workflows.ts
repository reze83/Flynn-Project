/**
 * List Workflows Tool
 *
 * Returns all available workflow templates with their descriptions,
 * trigger keywords, and agent sequences.
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { AGENT_CONTEXTS } from "./agent-contexts.js";

// Workflow definitions with descriptions
export const WORKFLOW_DEFINITIONS = {
  "new-project": {
    name: "New Project",
    description: "Create a new project from scratch",
    agents: ["scaffolder", "coder", "diagnostic"],
    triggers: [
      "new project",
      "create project",
      "scaffold project",
      "initialize project",
      "start project",
    ],
    useCase: "Starting a brand new codebase with proper structure",
  },
  "fix-bug": {
    name: "Fix Bug",
    description: "Diagnose and fix a bug in the codebase",
    agents: ["diagnostic", "coder", "diagnostic"],
    triggers: ["fix", "bug", "error", "broken", "crash", "issue", "failing"],
    useCase: "When something is broken and needs investigation + fix",
  },
  "add-feature": {
    name: "Add Feature",
    description: "Implement a new feature",
    agents: ["coder", "diagnostic"],
    triggers: ["add", "implement", "feature", "build", "create", "write"],
    useCase: "Adding new functionality to existing code",
  },
  refactor: {
    name: "Refactor",
    description: "Improve code structure without changing behavior",
    agents: ["diagnostic", "refactor", "diagnostic"],
    triggers: ["refactor", "improve", "clean", "optimize", "restructure"],
    useCase: "Cleaning up technical debt or improving performance",
  },
  release: {
    name: "Release",
    description: "Prepare and create a new release",
    agents: ["diagnostic", "release"],
    triggers: ["release", "publish", "version", "deploy", "tag"],
    useCase: "Versioning, changelog generation, and publishing",
  },
  setup: {
    name: "Setup",
    description: "Set up development environment",
    agents: ["installer", "diagnostic"],
    triggers: ["install", "setup", "configure", "dependencies", "environment"],
    useCase: "Installing dependencies and configuring tools",
  },
  analyze: {
    name: "Analyze",
    description: "Analyze code or system",
    agents: ["diagnostic"],
    triggers: ["analyze", "check", "diagnose", "inspect", "review"],
    useCase: "Understanding code, finding issues, code review",
  },
  "data-task": {
    name: "Data Task",
    description: "Data analysis and processing",
    agents: ["data"],
    triggers: ["data", "csv", "json", "statistics", "ml", "pandas"],
    useCase: "Working with datasets, statistics, ML tasks",
  },
  recover: {
    name: "Recover",
    description: "Recover from failures or bad state",
    agents: ["healer"],
    triggers: ["recover", "heal", "restore", "rollback", "undo"],
    useCase: "When something went wrong and needs recovery",
  },
  "security-audit": {
    name: "Security Audit",
    description: "Scan code for security vulnerabilities",
    agents: ["security"],
    triggers: ["security", "vulnerability", "cve", "audit", "owasp", "pentest", "secure"],
    useCase: "Finding security issues, OWASP checks, CVE scanning",
  },
  "code-review": {
    name: "Code Review",
    description: "Review code for quality and best practices",
    agents: ["reviewer"],
    triggers: ["review", "pr", "pull request", "feedback", "quality"],
    useCase: "Code review, PR feedback, standards enforcement",
  },
  "performance-audit": {
    name: "Performance Audit",
    description: "Analyze and optimize performance",
    agents: ["performance"],
    triggers: ["performance", "slow", "speed", "memory", "profile", "benchmark", "bottleneck"],
    useCase: "Finding bottlenecks, memory leaks, optimization",
  },
  "full-review": {
    name: "Full Review",
    description: "Comprehensive review: quality, security, and performance",
    agents: ["reviewer", "security", "performance"],
    triggers: ["full review", "comprehensive review", "complete review"],
    useCase: "Complete code analysis before major release",
  },
  "secure-release": {
    name: "Secure Release",
    description: "Security-checked release process",
    agents: ["security", "diagnostic", "release"],
    triggers: ["secure release", "production deploy", "safe release"],
    useCase: "Production releases with security validation",
  },

  // Advanced multi-agent workflows (Sprint 2)
  "full-stack-feature": {
    name: "Full Stack Feature",
    description: "End-to-end feature development with API, database, frontend, and deployment",
    agents: [
      "api-designer",
      "database-architect",
      "coder",
      "frontend-architect",
      "test-architect",
      "security",
      "devops-engineer",
    ],
    triggers: ["full stack", "end-to-end feature", "full feature", "complete feature"],
    useCase: "Building complete features spanning backend, frontend, and infrastructure",
  },
  "security-hardening": {
    name: "Security Hardening",
    description: "Comprehensive security fixes and hardening",
    agents: ["security", "reviewer", "diagnostic", "coder"],
    triggers: ["harden", "security fix", "security hardening", "fix vulnerabilities"],
    useCase: "Addressing security vulnerabilities and hardening the codebase",
  },
  "ml-pipeline": {
    name: "ML Pipeline",
    description: "Build and deploy machine learning pipelines",
    agents: ["data-engineer", "ml-engineer", "coder", "test-architect", "devops-engineer"],
    triggers: ["ml pipeline", "machine learning pipeline", "train model", "ml workflow"],
    useCase: "Creating ML systems from data preparation to deployment",
  },
  "incident-response": {
    name: "Incident Response",
    description: "Handle production incidents with diagnosis, fix, and recovery",
    agents: ["diagnostic", "incident-responder", "coder", "healer"],
    triggers: ["incident", "outage", "production down", "sev1", "emergency"],
    useCase: "Responding to production incidents and outages",
  },
  "codebase-migration": {
    name: "Codebase Migration",
    description: "Migrate codebases between frameworks or versions",
    agents: [
      "diagnostic",
      "migration-specialist",
      "coder",
      "test-architect",
      "reviewer",
      "documentation-architect",
    ],
    triggers: ["migrate codebase", "framework migration", "upgrade framework", "legacy migration"],
    useCase: "Upgrading frameworks, migrating to new versions, or modernizing legacy code",
  },

  // Documentation workflows
  "documentation-suite": {
    name: "Documentation Suite",
    description:
      "Generate comprehensive project documentation including README, API docs, and architecture guides",
    agents: ["diagnostic", "documentation-architect", "api-designer", "reviewer"],
    triggers: [
      "documentation suite",
      "full documentation",
      "comprehensive documentation",
      "project documentation",
      "generate docs",
      "create documentation",
    ],
    useCase:
      "Creating professional documentation for a project: README, API docs, architecture docs, and guides",
  },

  // Codex Integration workflows
  "codex-delegation": {
    name: "Codex Delegation",
    description: "Delegate a task to Codex CLI with proper context handoff",
    agents: ["orchestrator", "coder", "diagnostic"],
    triggers: ["delegate to codex", "use codex", "codex task"],
    useCase: "When a task is better suited for Codex (GPT-5) execution",
  },
  "hybrid-implementation": {
    name: "Hybrid Implementation",
    description: "Multi-AI workflow with Claude for design, Codex for execution",
    agents: ["orchestrator", "api-designer", "orchestrator", "diagnostic"],
    triggers: ["hybrid", "multi-ai", "claude and codex"],
    useCase: "Complex features requiring design thinking + high-volume coding",
  },
  "codex-specialist": {
    name: "Codex Specialist",
    description: "Use Codex as a specialist for specific domain tasks",
    agents: ["diagnostic", "orchestrator", "diagnostic"],
    triggers: ["codex specialist", "expert codex"],
    useCase: "Tasks requiring Codex's specialized capabilities",
  },
};

const outputSchema = z.object({
  workflows: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      agents: z.array(z.string()),
      agentNames: z.array(z.string()),
      triggers: z.array(z.string()),
      useCase: z.string(),
    }),
  ),
  count: z.number(),
});

export const listWorkflowsTool = createTool({
  id: "list-workflows",
  description:
    "List all available workflow templates with descriptions, agent sequences, and trigger keywords.",
  inputSchema: z.object({}).optional(),
  outputSchema,
  execute: async () => {
    const workflows = Object.entries(WORKFLOW_DEFINITIONS).map(([id, def]) => ({
      id,
      name: def.name,
      description: def.description,
      agents: def.agents,
      agentNames: def.agents.map((agentId) => AGENT_CONTEXTS[agentId]?.name || agentId),
      triggers: def.triggers,
      useCase: def.useCase,
    }));

    return {
      workflows,
      count: workflows.length,
    };
  },
});

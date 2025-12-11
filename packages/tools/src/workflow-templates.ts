/**
 * Workflow Templates
 *
 * Defines workflow templates and trigger keywords for the orchestrator.
 * Extracted from orchestrate.ts to improve maintainability.
 */

/**
 * Workflow templates mapping template names to agent sequences
 */
export const WORKFLOW_TEMPLATES: Record<string, string[]> = {
  // Basic workflows
  "new-project": ["scaffolder", "coder", "diagnostic"],
  "fix-bug": ["diagnostic", "coder", "diagnostic"],
  "add-feature": ["coder", "diagnostic"],
  refactor: ["diagnostic", "refactor", "diagnostic"],
  release: ["diagnostic", "release"],
  setup: ["installer", "diagnostic"],
  analyze: ["diagnostic"],
  "data-task": ["data"],
  recover: ["healer"],

  // Review workflows
  "security-audit": ["security"],
  "code-review": ["reviewer"],
  "performance-audit": ["performance"],
  "full-review": ["reviewer", "security", "performance"],
  "secure-release": ["security", "diagnostic", "release"],

  // Advanced multi-agent workflows (Sprint 2)
  "full-stack-feature": [
    "api-designer",
    "database-architect",
    "coder",
    "frontend-architect",
    "test-architect",
    "security",
    "devops-engineer",
  ],
  "security-hardening": ["security", "reviewer", "diagnostic", "coder"],
  "ml-pipeline": ["data-engineer", "ml-engineer", "coder", "test-architect", "devops-engineer"],
  "incident-response": ["diagnostic", "incident-responder", "coder", "healer"],
  "codebase-migration": [
    "diagnostic",
    "migration-specialist",
    "coder",
    "test-architect",
    "reviewer",
    "documentation-architect",
  ],

  // Documentation workflows
  "documentation-suite": ["diagnostic", "documentation-architect", "api-designer", "reviewer"],

  // Codex Integration workflows
  "codex-delegation": ["orchestrator", "coder", "diagnostic"],
  "hybrid-implementation": ["orchestrator", "api-designer", "orchestrator", "diagnostic"],
  "codex-specialist": ["diagnostic", "orchestrator", "diagnostic"],
};

/**
 * Keywords that map to workflow templates
 */
export const TEMPLATE_TRIGGERS: Record<string, string[]> = {
  "new-project": [
    "new project",
    "create project",
    "scaffold project",
    "initialize project",
    "start project",
  ],
  "fix-bug": ["fix", "bug", "error", "broken", "crash", "issue", "failing"],
  "add-feature": ["add", "implement", "feature", "build", "create", "write"],
  refactor: ["refactor", "improve", "clean", "optimize", "restructure"],
  release: ["release", "publish", "version", "deploy", "tag"],
  setup: ["install", "setup", "configure", "dependencies", "environment"],
  analyze: ["analyze", "check", "diagnose", "inspect", "review"],
  "data-task": ["data", "csv", "json", "statistics", "ml", "pandas"],
  recover: ["recover", "heal", "restore", "rollback", "undo"],
  "security-audit": ["security", "vulnerability", "cve", "audit", "owasp", "pentest", "secure"],
  "code-review": ["review", "pr", "pull request", "feedback", "quality"],
  "performance-audit": [
    "performance",
    "slow",
    "speed",
    "memory",
    "profile",
    "benchmark",
    "bottleneck",
  ],
  "full-review": ["full review", "comprehensive review", "complete review"],
  "secure-release": ["secure release", "production deploy", "safe release"],

  // Advanced workflows (Sprint 2)
  "full-stack-feature": [
    "full stack",
    "end-to-end feature",
    "full feature",
    "complete feature",
    "feature with api",
    "feature with frontend",
  ],
  "security-hardening": [
    "harden",
    "security fix",
    "security hardening",
    "fix vulnerabilities",
    "secure the code",
  ],
  "ml-pipeline": [
    "ml pipeline",
    "machine learning pipeline",
    "train model",
    "build model",
    "ml workflow",
    "data science",
  ],
  "incident-response": [
    "incident",
    "outage",
    "production down",
    "system down",
    "emergency fix",
    "sev1",
    "post-mortem",
  ],
  "codebase-migration": [
    "migrate codebase",
    "framework migration",
    "upgrade framework",
    "legacy migration",
    "modernize codebase",
    "version upgrade",
  ],

  // Documentation workflows
  "documentation-suite": [
    "documentation suite",
    "full documentation",
    "comprehensive documentation",
    "project documentation",
    "generate docs",
    "create documentation",
    "document project",
    "write docs",
  ],

  // Codex Integration workflows
  "codex-delegation": ["delegate to codex", "use codex", "codex task", "gpt", "openai"],
  "hybrid-implementation": ["hybrid", "multi-ai", "claude and codex", "design then implement"],
  "codex-specialist": ["codex specialist", "expert codex", "delegate specialist"],
};

/**
 * Detect which workflow template to use based on task description
 */
export function detectTemplate(task: string): string {
  const lowerTask = task.toLowerCase();
  let bestTemplate = "add-feature";
  let bestScore = 0;

  for (const [template, triggers] of Object.entries(TEMPLATE_TRIGGERS)) {
    let score = 0;
    for (const trigger of triggers) {
      if (lowerTask.includes(trigger)) {
        score += trigger.split(" ").length; // Multi-word triggers score higher
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestTemplate = template;
    }
  }

  return bestTemplate;
}

/**
 * Get agent sequence for a workflow template
 */
export function getWorkflowAgents(template: string): string[] {
  return WORKFLOW_TEMPLATES[template] || ["coder"];
}

/**
 * Get all available workflow template names
 */
export function getAvailableWorkflows(): string[] {
  return Object.keys(WORKFLOW_TEMPLATES);
}

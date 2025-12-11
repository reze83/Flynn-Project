# Flynn Workflows Reference

Flynn Workflows orchestrate multiple agents for complex, multi-step tasks. This document describes all 22 available workflows.

## Overview

| Category | Workflows | Count |
|----------|-----------|-------|
| **Basic Development** | new-project, fix-bug, add-feature, refactor, release, setup | 6 |
| **Analysis** | analyze, data-task, recover | 3 |
| **Quality & Security** | security-audit, code-review, performance-audit, full-review | 4 |
| **Multi-Agent Specialized** | full-stack-feature, security-hardening, ml-pipeline, incident-response, codebase-migration | 5 |
| **Release & Docs** | secure-release, documentation-suite | 2 |
| **Codex Integration** | codex-delegation, hybrid-implementation, codex-specialist | 3 |

**Total: 22 Workflows**

---

## Basic Development Workflows

### new-project

**Purpose:** Create a new project from scratch with proper structure.

| Property | Value |
|----------|-------|
| Agents | scaffolder → coder → diagnostic |
| Triggers | "new project", "create project", "scaffold project", "initialize project", "start project" |

**Use Case:** Starting a brand new codebase with proper structure, configuration, and initial setup.

**Example:**
```bash
mcp__flynn__orchestrate({ task: "create a new TypeScript CLI project" })
```

---

### fix-bug

**Purpose:** Diagnose and fix bugs in the codebase.

| Property | Value |
|----------|-------|
| Agents | diagnostic → coder → diagnostic |
| Triggers | "fix", "bug", "error", "broken", "crash", "issue", "failing" |

**Use Case:** When something is broken and needs investigation + fix + verification.

**Example:**
```bash
mcp__flynn__orchestrate({ task: "fix the authentication bug in login.ts" })
```

---

### add-feature

**Purpose:** Implement a new feature.

| Property | Value |
|----------|-------|
| Agents | coder → diagnostic |
| Triggers | "add", "implement", "feature", "build", "create", "write" |

**Use Case:** Adding new functionality to existing code.

**Example:**
```bash
mcp__flynn__orchestrate({ task: "add dark mode toggle to the settings page" })
```

---

### refactor

**Purpose:** Improve code structure without changing behavior.

| Property | Value |
|----------|-------|
| Agents | diagnostic → refactor → diagnostic |
| Triggers | "refactor", "improve", "clean", "optimize", "restructure" |

**Use Case:** Cleaning up technical debt or improving performance.

**Example:**
```bash
mcp__flynn__orchestrate({ task: "refactor the user service to use dependency injection" })
```

---

### release

**Purpose:** Prepare and create a new release.

| Property | Value |
|----------|-------|
| Agents | diagnostic → release |
| Triggers | "release", "publish", "version", "deploy", "tag" |

**Use Case:** Versioning, changelog generation, and publishing.

**Example:**
```bash
mcp__flynn__orchestrate({ task: "release version 2.0.0" })
```

---

### setup

**Purpose:** Set up development environment.

| Property | Value |
|----------|-------|
| Agents | installer → diagnostic |
| Triggers | "install", "setup", "configure", "dependencies", "environment" |

**Use Case:** Installing dependencies and configuring tools.

**Example:**
```bash
mcp__flynn__orchestrate({ task: "setup the development environment" })
```

---

## Analysis Workflows

### analyze

**Purpose:** Analyze code or system.

| Property | Value |
|----------|-------|
| Agents | diagnostic |
| Triggers | "analyze", "check", "diagnose", "inspect", "review" |

**Use Case:** Understanding code, finding issues, code review.

**Example:**
```bash
mcp__flynn__orchestrate({ task: "analyze the database query performance" })
```

---

### data-task

**Purpose:** Data analysis and processing.

| Property | Value |
|----------|-------|
| Agents | data |
| Triggers | "data", "csv", "json", "statistics", "ml", "pandas" |

**Use Case:** Working with datasets, statistics, ML tasks.

**Example:**
```bash
mcp__flynn__orchestrate({ task: "analyze the sales data CSV and generate insights" })
```

---

### recover

**Purpose:** Recover from failures or bad state.

| Property | Value |
|----------|-------|
| Agents | healer |
| Triggers | "recover", "heal", "restore", "rollback", "undo" |

**Use Case:** When something went wrong and needs recovery.

**Example:**
```bash
mcp__flynn__orchestrate({ task: "recover from the failed deployment" })
```

---

## Quality & Security Workflows

### security-audit

**Purpose:** Scan code for security vulnerabilities.

| Property | Value |
|----------|-------|
| Agents | security |
| Triggers | "security", "vulnerability", "cve", "audit", "owasp", "pentest", "secure" |

**Use Case:** Finding security issues, OWASP checks, CVE scanning.

**Example:**
```bash
mcp__flynn__orchestrate({ task: "run a security audit on the authentication module" })
```

---

### code-review

**Purpose:** Review code for quality and best practices.

| Property | Value |
|----------|-------|
| Agents | reviewer |
| Triggers | "review", "pr", "pull request", "feedback", "quality" |

**Use Case:** Code review, PR feedback, standards enforcement.

**Example:**
```bash
mcp__flynn__orchestrate({ task: "review the new API endpoints" })
```

---

### performance-audit

**Purpose:** Analyze and optimize performance.

| Property | Value |
|----------|-------|
| Agents | performance |
| Triggers | "performance", "slow", "speed", "memory", "profile", "benchmark", "bottleneck" |

**Use Case:** Finding bottlenecks, memory leaks, optimization.

**Example:**
```bash
mcp__flynn__orchestrate({ task: "find performance bottlenecks in the search feature" })
```

---

### full-review

**Purpose:** Comprehensive review: quality, security, and performance.

| Property | Value |
|----------|-------|
| Agents | reviewer → security → performance |
| Triggers | "full review", "comprehensive review", "complete review" |

**Use Case:** Complete code analysis before major release.

**Example:**
```bash
mcp__flynn__orchestrate({ task: "do a full review before the v2.0 release" })
```

---

## Multi-Agent Specialized Workflows

### full-stack-feature

**Purpose:** End-to-end feature development with API, database, frontend, and deployment.

| Property | Value |
|----------|-------|
| Agents | api-designer → database-architect → coder → frontend-architect → test-architect → security → devops-engineer |
| Steps | 7 |
| Triggers | "full stack", "end-to-end feature", "full feature", "complete feature" |

**Use Case:** Building complete features spanning backend, frontend, and infrastructure.

**Example:**
```bash
mcp__flynn__orchestrate({ task: "build full stack user authentication with OAuth" })
```

**Agent Responsibilities:**
1. **api-designer** - Design API endpoints and contracts
2. **database-architect** - Design database schema
3. **coder** - Implement the feature
4. **frontend-architect** - Design frontend components
5. **test-architect** - Create test strategy
6. **security** - Security review
7. **devops-engineer** - Deployment configuration

---

### security-hardening

**Purpose:** Comprehensive security fixes and hardening.

| Property | Value |
|----------|-------|
| Agents | security → reviewer → diagnostic → coder |
| Steps | 4 |
| Triggers | "harden", "security fix", "security hardening", "fix vulnerabilities" |

**Use Case:** Addressing security vulnerabilities and hardening the codebase.

**Example:**
```bash
mcp__flynn__orchestrate({ task: "harden the application against OWASP top 10" })
```

---

### ml-pipeline

**Purpose:** Build and deploy machine learning pipelines.

| Property | Value |
|----------|-------|
| Agents | data-engineer → ml-engineer → coder → test-architect → devops-engineer |
| Steps | 5 |
| Triggers | "ml pipeline", "machine learning pipeline", "train model", "ml workflow" |

**Use Case:** Creating ML systems from data preparation to deployment.

**Example:**
```bash
mcp__flynn__orchestrate({ task: "build an ML pipeline for sentiment analysis" })
```

---

### incident-response

**Purpose:** Handle production incidents with diagnosis, fix, and recovery.

| Property | Value |
|----------|-------|
| Agents | diagnostic → incident-responder → coder → healer |
| Steps | 4 |
| Triggers | "incident", "outage", "production down", "sev1", "emergency" |

**Use Case:** Responding to production incidents and outages.

**Example:**
```bash
mcp__flynn__orchestrate({ task: "respond to the API outage incident" })
```

---

### codebase-migration

**Purpose:** Migrate codebases between frameworks or versions.

| Property | Value |
|----------|-------|
| Agents | diagnostic → migration-specialist → coder → test-architect → reviewer → documentation-architect |
| Steps | 6 |
| Triggers | "migrate codebase", "framework migration", "upgrade framework", "legacy migration" |

**Use Case:** Upgrading frameworks, migrating to new versions, or modernizing legacy code.

**Example:**
```bash
mcp__flynn__orchestrate({ task: "migrate from React 17 to React 18" })
```

---

## Release & Documentation Workflows

### secure-release

**Purpose:** Security-checked release process.

| Property | Value |
|----------|-------|
| Agents | security → diagnostic → release |
| Triggers | "secure release", "production deploy", "safe release" |

**Use Case:** Production releases with security validation.

**Example:**
```bash
mcp__flynn__orchestrate({ task: "do a secure release to production" })
```

---

### documentation-suite

**Purpose:** Generate comprehensive project documentation.

| Property | Value |
|----------|-------|
| Agents | diagnostic → documentation-architect → api-designer → reviewer |
| Steps | 4 |
| Triggers | "documentation suite", "full documentation", "comprehensive documentation", "project documentation", "generate docs", "create documentation" |

**Use Case:** Creating professional documentation for a project: README, API docs, architecture docs, and guides.

**Example:**
```bash
mcp__flynn__orchestrate({ task: "generate comprehensive documentation for the project" })
```

---

## Usage

### List All Workflows

```bash
mcp__flynn__list-workflows({})
```

### Auto-Detect Workflow

```bash
mcp__flynn__orchestrate({ task: "fix the authentication bug" })
# Auto-detects: fix-bug workflow
```

### Explicit Workflow Selection

```bash
mcp__flynn__orchestrate({ task: "update the auth system", workflow: "security-hardening" })
```

### Execution Modes

```bash
# Sequential (default) - agents run one after another
mcp__flynn__orchestrate({ task: "...", mode: "sequential" })

# Parallel - independent agents run simultaneously
mcp__flynn__orchestrate({ task: "...", mode: "parallel" })

# Auto - Flynn determines the best mode
mcp__flynn__orchestrate({ task: "...", mode: "auto" })
```

### Auto-Parallel Optimization

Flynn automatically detects opportunities for parallel execution based on agent dependencies:

```bash
# Enable auto-optimization (default: true)
mcp__flynn__orchestrate({
  task: "full review of the codebase",
  auto_optimize: true,
  parallel_threshold: 2  # Minimum agents to trigger parallelization
})
```
> **Hinweis:** Die Parameter `parallel_threshold` und der Standardwert für `mode` können auch über die Umgebungsvariablen `FLYNN_PARALLEL_THRESHOLD` bzw. `FLYNN_PARALLEL_MODE` gesteuert werden.

**Response includes optimization info:**
```json
{
  "template": "full-review",
  "agents": [...],
  "optimization": {
    "auto_optimized": true,
    "parallel_opportunities": 1,
    "estimated_speedup": "~1.5x faster",
    "independent_groups": [
      {
        "agents": ["reviewer-1", "security-2", "performance-3"],
        "reason": "Review agents have no inter-dependencies"
      }
    ]
  }
}
```

**Agent Dependency Graph:**
Flynn analyzes dependencies to find truly independent agents:
- **Review agents** (security, reviewer, performance) - can run in parallel
- **Architecture agents** (api-designer, database-architect, system-architect) - can run in parallel
- **Coder** depends on diagnostic, api-designer, database-architect
- **Test-architect** depends on coder
- **DevOps-engineer** depends on coder, test-architect

---

## Codex Integration Workflows

### codex-delegation

**Purpose:** Delegate a task to Codex CLI with proper context handoff.

| Property | Value |
|----------|-------|
| Agents | orchestrator → coder → diagnostic |
| Triggers | "delegate to codex", "use codex", "codex task", "gpt", "openai" |

**Use Case:** When a task is better suited for Codex (GPT) execution.

**Example:**
```bash
mcp__flynn__orchestrate({ task: "delegate API implementation to codex" })
```

---

### hybrid-implementation

**Purpose:** Multi-AI workflow with Claude for design, Codex for execution.

| Property | Value |
|----------|-------|
| Agents | orchestrator → api-designer → orchestrator → diagnostic |
| Triggers | "hybrid", "multi-ai", "claude and codex", "design then implement" |

**Use Case:** Complex features requiring design thinking + high-volume coding.

**Example:**
```bash
mcp__flynn__orchestrate({ task: "hybrid implementation of user dashboard" })
```

---

### codex-specialist

**Purpose:** Use Codex as a specialist for specific domain tasks.

| Property | Value |
|----------|-------|
| Agents | diagnostic → orchestrator → diagnostic |
| Triggers | "codex specialist", "expert codex", "delegate specialist" |

**Use Case:** Tasks requiring Codex's specialized capabilities.

**Example:**
```bash
mcp__flynn__orchestrate({ task: "use codex specialist for regex optimization" })
```

---

## See Also

- [AGENTS.md](./AGENTS.md) - All 27 Agents
- [TOOLS.md](./TOOLS.md) - All 18 MCP Tools
- [SKILLS.md](./SKILLS.md) - All 17 Skills
- [README.md](../README.md) - Quick Start

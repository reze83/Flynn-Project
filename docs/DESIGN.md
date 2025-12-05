# Flynn-Project Design Document

## Vision

Flynn-Project ist ein **Mastra-powered** autonomer KI-Agent-Orchestrator, der Claude Code erweitert. Das System installiert sich selbst, erkennt seine Umgebung, und steuert spezialisierte Sub-Agents für Entwicklungsaufgaben.

**Ziel:** Ein einziger Entry-Point (`/flynn`) für alle Entwicklungsaufgaben - von Installation bis Release.

## Flynn Principles

### Language Principles

| Prinzip | Regel | Begründung |
|---------|-------|------------|
| **L1** | User-Kommunikation in der Sprache des Users | Natürliche Interaktion |
| **L2** | Code, Kommentare, Variablen immer Englisch | Industrie-Standard, Tooling-Kompatibilität |
| **L3** | Interne Logs auf Englisch | Debugging-Konsistenz |
| **L4** | Technische Dokumentation auf Englisch | Breitere Zugänglichkeit |

> **Keine interne Übersetzungsstrategie:** Research zeigt, dass LLMs bei high-resource Sprachen (DE, FR, ES) native Reasoning vergleichbar mit Englisch performt. Der Overhead einer internen Übersetzung überwiegt den marginalen Vorteil. Code-Generierung erfolgt ohnehin auf Englisch.

### Operational Principles

| Prinzip | Regel | Beschreibung |
|---------|-------|--------------|
| **O1** | Autonomy First | Selbstständig handeln, nur bei Unklarheit fragen |
| **O2** | Idempotency | Jede Operation ist wiederholbar ohne Seiteneffekte |
| **O3** | Graceful Degradation | Bei Fehlern: Healer → Retry → Escalate to User |
| **O4** | Fail Fast | Fehler früh erkennen, klar kommunizieren |

### Code Principles

| Prinzip | Regel | Beschreibung |
|---------|-------|--------------|
| **C1** | KISS | Einfachste Lösung zuerst |
| **C2** | YAGNI | Keine spekulativen Features |
| **C3** | Early Return | Tiefe Verschachtelung vermeiden |
| **C4** | Single Responsibility | Eine Funktion, ein Zweck |
| **C5** | DRY | Code-Duplikation vermeiden |

### Security Principles

| Prinzip | Regel | Beschreibung |
|---------|-------|--------------|
| **S1** | Least Privilege | Nur notwendige Berechtigungen anfordern |
| **S2** | XDG Compliance | Keine hardcodierten System-/User-Pfade |
| **S3** | Policy Enforcement | flynn.policy.yaml immer respektieren |
| **S4** | No Secrets in Code | Credentials nur via Environment Variables |

### Observability Principles

| Prinzip | Regel | Beschreibung |
|---------|-------|--------------|
| **V1** | Structured Logging | Alle Aktionen nachvollziehbar (JSON, pino) |
| **V2** | Traceability | Requests durch alle Agents verfolgbar |
| **V3** | Transparency | User sieht welcher Agent gerade arbeitet |

## Technology Stack

| Technology | Purpose | Package |
|------------|---------|---------|
| **Mastra** | Agent & Workflow Framework | @mastra/core, @mastra/mcp |
| MCP | Model Context Protocol | @mastra/mcp |
| Pino | Structured Logging | pino |
| Zod | Schema Validation | zod |
| Anthropic SDK | LLM Provider | @ai-sdk/anthropic |
| OpenAI SDK | LLM Provider (optional) | @ai-sdk/openai |

**Mastra:** Open-Source TypeScript AI Framework
- GitHub: https://github.com/mastra-ai/mastra (18.6k ⭐)
- Docs: https://mastra.ai
- Lizenz: MIT

## Dependencies

### TypeScript (npm/pnpm)

| Package | Version | Purpose |
|---------|---------|---------|
| @mastra/core | ^0.9.0 | Agent Framework |
| @mastra/mcp | ^0.14.0 | MCP Server/Client |
| pino | ^9.0.0 | Structured Logging |
| zod | ^3.24.0 | Schema Validation |
| @ai-sdk/anthropic | ^1.0.0 | Claude LLM Provider |
| @ai-sdk/openai | ^1.0.0 | OpenAI Provider (optional) |

### Python (uv/pip)

| Package | Version | Purpose |
|---------|---------|---------|
| mcp | ^1.0.0 | MCP Protocol |
| pandas | ^2.0.0 | Data Analysis |
| numpy | ^1.26.0 | Numerical Operations |
| transformers | ^4.40.0 | ML Models |
| torch | ^2.0.0 | ML Backend |

### Memory & Storage

| Package | Version | Purpose |
|---------|---------|---------|
| @mastra/memory | ^0.3.0 | Agent Memory System |
| @mastra/libsql | ^0.3.0 | SQLite Storage Backend |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| typescript | ^5.7.0 | TypeScript Compiler |
| @types/node | ^22.0.0 | Node.js Type Definitions |
| @biomejs/biome | ^1.9.0 | Linting/Formatting |
| vitest | ^2.1.0 | Unit Testing |

## Components

| Komponente | Soll | Spec | Struktur |
|------------|------|------|----------|
| MCP Server | 1 | Core | apps/server/src/server.ts |
| Core Package | 6 | Core | packages/core/src/ |
| Bootstrap CLI | 1 | Bootstrap | packages/bootstrap/src/cli.ts |
| Installer | 5 | Bootstrap | packages/bootstrap/src/installer/ |
| Detector | 6 | Bootstrap | packages/bootstrap/src/detector/ |
| Validator | 3 | Bootstrap | packages/bootstrap/src/validator/ |
| Orchestrator Agent | 1 | Agents | packages/agents/src/orchestrator.ts |
| Mastra Agents | 8 | Agents | packages/agents/src/ |
| Mastra Workflows | 2 | Agents | packages/agents/src/workflows/ |
| TypeScript Tools | 5 | Tools | packages/tools/src/ |
| Python Data Tools | 5 | Python | packages/python/flynn_data/ |
| Python ML Tools | 4 | Python | packages/python/flynn_ml/ |

## Constraints

| Constraint | Regel | Betrifft |
|------------|-------|----------|
| User Language | Respond in user's language | All Agents |
| Code Language | EN for code, comments, variables, logs | All |
| Paths | No hardcoded system/user paths (XDG) | All |
| Node Version | >=20.0.0 | TypeScript |
| Python Version | >=3.11 | Python |
| Package Manager | pnpm (JS), uv (Python) | All |
| API Key | ANTHROPIC_API_KEY for agents | Agents |
| Idempotency | All installers must be idempotent | Bootstrap |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Claude Code                               │
│                            │                                     │
│                      /flynn "prompt"                             │
│                            │                                     │
│                       MCP Protocol                               │
│                            ▼                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  Flynn MCP Server                            ││
│  │  ┌─────────────────────────────────────────────────────────┐││
│  │  │              Orchestrator Agent                          │││
│  │  │     (Routing + Capability-Negotiation)                   │││
│  │  └────────────────────┬────────────────────────────────────┘││
│  │                       │                                      ││
│  │    ┌──────────────────┼──────────────────────┐              ││
│  │    ▼                  ▼                      ▼              ││
│  │ ┌──────────┐  ┌──────────────┐  ┌──────────────────┐       ││
│  │ │Installer │  │  Diagnostic  │  │    Scaffolder    │       ││
│  │ │  Agent   │  │    Agent     │  │      Agent       │       ││
│  │ └──────────┘  └──────────────┘  └──────────────────┘       ││
│  │ ┌──────────┐  ┌──────────────┐  ┌──────────────────┐       ││
│  │ │  Coder   │  │   Refactor   │  │     Release      │       ││
│  │ │  Agent   │  │    Agent     │  │      Agent       │       ││
│  │ └──────────┘  └──────────────┘  └──────────────────┘       ││
│  │ ┌──────────┐  ┌──────────────┐                              ││
│  │ │  Healer  │  │     Data     │  ← Existing                  ││
│  │ │  Agent   │  │    Agent     │                              ││
│  │ └──────────┘  └──────────────┘                              ││
│  │                       │                                      ││
│  │  ┌────────────────────┴────────────────────────────────┐    ││
│  │  │                    Tools                             │    ││
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────┐  │    ││
│  │  │  │ Project │ │  System │ │   Git   │ │   Shell   │  │    ││
│  │  │  │ Analysis│ │  Info   │ │   Ops   │ │   (safe)  │  │    ││
│  │  │  └─────────┘ └─────────┘ └─────────┘ └───────────┘  │    ││
│  │  └─────────────────────────────────────────────────────┘    ││
│  │                       │                                      ││
│  │  ┌────────────────────┴────────────────────────────────┐    ││
│  │  │              Python MCP (optional)                   │    ││
│  │  │  ┌────────────────┐  ┌────────────────────────────┐ │    ││
│  │  │  │   Data Tools   │  │        ML Tools            │ │    ││
│  │  │  │   (pandas)     │  │     (transformers)         │ │    ││
│  │  │  └────────────────┘  └────────────────────────────┘ │    ││
│  │  └─────────────────────────────────────────────────────┘    ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Workspace Configuration

### pnpm-workspace.yaml

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

### Root package.json

```json
{
  "name": "flynn-project",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "pnpm -r build",
    "dev": "pnpm -r --parallel dev",
    "lint": "biome check .",
    "test": "pnpm -r test",
    "bootstrap": "pnpm --filter @flynn/bootstrap start"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "typescript": "^5.7.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

## Project Structure

```
Flynn-Project/
├── pnpm-workspace.yaml
├── package.json
├── install.sh                     # Shell bootstrap (curl | bash)
├── LICENSE
├── README.md
├── .gitignore
│
├── packages/
│   ├── core/                       # @flynn/core
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── mcp-server.ts       # MCP Server Factory
│   │   │   ├── agent-base.ts       # Abstract Agent Class
│   │   │   ├── types.ts            # Shared Types
│   │   │   ├── paths.ts            # Path-neutral utilities (XDG, env)
│   │   │   ├── logger.ts           # Structured logging (pino)
│   │   │   └── plugins/
│   │   │       ├── index.ts
│   │   │       ├── loader.ts       # Plugin loader
│   │   │       ├── registry.ts     # Plugin registry
│   │   │       └── types.ts        # Plugin types
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── bootstrap/                  # @flynn/bootstrap
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── cli.ts              # CLI entry: npx @flynn/bootstrap
│   │   │   ├── installer/
│   │   │   │   ├── index.ts
│   │   │   │   ├── claude-code.ts  # Claude Code installation
│   │   │   │   ├── sdk-typescript.ts
│   │   │   │   ├── sdk-python.ts
│   │   │   │   ├── dependencies.ts # Node, pnpm, uv, etc.
│   │   │   │   └── idempotent.ts   # Idempotency logic
│   │   │   ├── detector/
│   │   │   │   ├── index.ts        # Aggregates all detectors
│   │   │   │   ├── wsl.ts          # WSL2 detection
│   │   │   │   ├── node.ts         # Node.js detection
│   │   │   │   ├── python.ts       # Python detection
│   │   │   │   ├── git.ts          # Git detection
│   │   │   │   ├── vscode.ts       # VS Code detection
│   │   │   │   └── types.ts        # Environment types
│   │   │   └── validator/
│   │   │       ├── index.ts
│   │   │       ├── post-install.ts # Post-install checks
│   │   │       ├── health.ts       # Health checks
│   │   │       └── report.ts       # Validation report
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── agents/                     # @flynn/agents
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── orchestrator.ts     # Main router + capability negotiation
│   │   │   ├── installer.ts        # Installation agent
│   │   │   ├── diagnostic.ts       # Diagnostic agent
│   │   │   ├── scaffolder.ts       # Project generation agent
│   │   │   ├── coder.ts            # Code generation agent
│   │   │   ├── refactor.ts         # Refactoring agent
│   │   │   ├── release.ts          # Release preparation agent
│   │   │   ├── healer.ts           # Self-healing agent
│   │   │   ├── data.ts             # Data analysis agent (existing)
│   │   │   ├── capabilities.ts     # Agent capability definitions
│   │   │   └── workflows/
│   │   │       ├── index.ts
│   │   │       ├── analysis.ts     # Analysis workflow (existing)
│   │   │       └── install.ts      # Installation workflow
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── tools/                      # @flynn/tools
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── project-analysis.ts # Existing
│   │   │   ├── system-info.ts      # Existing
│   │   │   ├── git-ops.ts          # Git operations
│   │   │   ├── file-ops.ts         # File operations
│   │   │   └── shell.ts            # Safe shell execution
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── python/                     # flynn-python (PyPI)
│       ├── flynn_data/
│       │   ├── __init__.py
│       │   └── tools.py            # 5 data tools
│       ├── flynn_ml/
│       │   ├── __init__.py
│       │   └── tools.py            # 4 ML tools
│       ├── pyproject.toml
│       └── README.md
│
├── apps/
│   └── server/                     # Main MCP Server
│       ├── src/
│       │   └── server.ts           # Combines all packages
│       ├── package.json
│       └── tsconfig.json
│
├── config/
│   ├── flynn.policy.yaml           # Security/permissions model
│   └── capabilities.yaml           # Agent capability registry
│
├── .claude/
│   └── commands/
│       └── flynn.md                # /flynn slash command
│
└── docs/
    └── DESIGN.md                   # This file (includes architecture & setup)
```

## Component Specifications

### Core Package (@flynn/core)

| File | Purpose |
|------|---------|
| mcp-server.ts | Factory for creating MCP servers |
| agent-base.ts | Abstract base class for all agents |
| types.ts | Shared TypeScript types |
| paths.ts | XDG-compliant, env-based path resolution |
| logger.ts | Pino-based structured logging |
| plugins/loader.ts | Dynamic plugin loading |
| plugins/registry.ts | Plugin registration and discovery |

### Bootstrap Package (@flynn/bootstrap)

| File | Purpose |
|------|---------|
| cli.ts | `npx @flynn/bootstrap` entry point |
| installer/claude-code.ts | Install Claude Code CLI |
| installer/sdk-typescript.ts | Install @anthropic-ai/agent-sdk |
| installer/sdk-python.ts | Install anthropic-agent-sdk (pip) |
| installer/dependencies.ts | Install Node, pnpm, uv, Git |
| installer/idempotent.ts | Check-before-install logic |
| detector/wsl.ts | Detect WSL2 environment |
| detector/node.ts | Detect Node.js version |
| detector/python.ts | Detect Python version |
| detector/git.ts | Detect Git installation |
| detector/vscode.ts | Detect VS Code |
| validator/post-install.ts | Verify installation success |
| validator/health.ts | Runtime health checks |
| validator/report.ts | Generate validation report |

### Agents Package (@flynn/agents)

| Agent | Capability | Trigger Keywords |
|-------|------------|------------------|
| orchestrator | Route to sub-agents | Always (entry point) |
| installer | Install dependencies | "install", "setup", "bootstrap" |
| diagnostic | Diagnose issues | "diagnose", "debug", "why", "error" |
| scaffolder | Generate projects | "create", "new project", "scaffold" |
| coder | Write code | "implement", "code", "write", "add" |
| refactor | Improve code | "refactor", "improve", "clean up" |
| release | Prepare releases | "release", "publish", "version" |
| healer | Fix issues | Automatic (on failure) |
| data | Data analysis | "analyze data", "csv", "statistics" |

### Tools Package (@flynn/tools)

| Tool | Purpose |
|------|---------|
| project-analysis.ts | Analyze project structure |
| system-info.ts | Get system information |
| git-ops.ts | Git commands (status, commit, push) |
| file-ops.ts | File read/write/search |
| shell.ts | Safe shell command execution |

### Python Package (flynn-python)

| Module | Tools |
|--------|-------|
| flynn_data | load_csv, describe, filter, aggregate, correlate |
| flynn_ml | sentiment, summarize, classify, embeddings |

## Configuration Files

### flynn.policy.yaml

```yaml
version: "1.0"
permissions:
  shell:
    allow:
      - "git *"
      - "pnpm *"
      - "npm *"
      - "uv *"
      - "node *"
      - "python *"
    deny:
      - "rm -rf /"
      - "sudo *"
  paths:
    writable:
      - "${XDG_DATA_HOME}/flynn"
      - "${PROJECT_ROOT}"
    readonly:
      - "/etc"
      - "/usr"
  agents:
    max_iterations: 10
    timeout_seconds: 300
```

### LLM Guardrails (inputProcessors/outputProcessors)

Zusätzlich zur policy.yaml bietet Mastra LLM-Level Guardrails für Defense-in-Depth:

| Layer | Mechanismus | Schutz vor |
|-------|-------------|------------|
| OS-Level | flynn.policy.yaml | Shell-Injection, Pfad-Traversal |
| LLM-Level | inputProcessors | Prompt Injection, PII-Leaks |
| LLM-Level | outputProcessors | Sensitive Daten in Responses |

```typescript
// packages/agents/src/orchestrator.ts
import { Agent } from "@mastra/core/agent";
import { PromptInjectionDetector, PIIDetector } from "@mastra/core/processors";

export const orchestrator = new Agent({
  id: "flynn-orchestrator",
  // ... other config

  // Input validation (before LLM)
  inputProcessors: [
    new PromptInjectionDetector({
      model: "anthropic/claude-haiku-4-5-20251001", // Fast model for validation
      threshold: 0.8,
      strategy: "block",
      detectionTypes: ["injection", "jailbreak", "system-override"],
    }),
  ],

  // Output validation (after LLM)
  outputProcessors: [
    new PIIDetector({
      model: "anthropic/claude-haiku-4-5-20251001",
      threshold: 0.6,
      strategy: "redact",
      redactionMethod: "mask",
      detectionTypes: ["api-key", "password", "credit-card"],
    }),
  ],
});
```

> **Note:** Guardrails sind optional und können pro Agent aktiviert werden.
> Für v1: Nur Orchestrator benötigt Guardrails (Sub-Agents erben indirekt).

### capabilities.yaml

```yaml
version: "1.0"

# Agent routing configuration
# Note: Delegation between sub-agents is handled by the Orchestrator
# via Mastra's Agent Network pattern (description-based routing)

agents:
  installer:
    description: "Handles installation, setup, and dependency management"
    triggers: ["install", "setup", "bootstrap", "dependency"]
    tools: ["shell", "file-ops", "git-ops"]

  diagnostic:
    description: "Diagnoses issues, analyzes errors, troubleshoots problems"
    triggers: ["diagnose", "debug", "error", "why", "broken"]
    tools: ["project-analysis", "system-info", "shell"]

  scaffolder:
    description: "Generates new projects, creates boilerplate code"
    triggers: ["create", "new", "scaffold", "init", "generate project"]
    tools: ["file-ops", "git-ops", "shell"]

  coder:
    description: "Writes and implements code, adds features"
    triggers: ["implement", "code", "write", "add", "function", "feature"]
    tools: ["file-ops", "project-analysis"]

  refactor:
    description: "Improves code structure, optimizes, cleans up"
    triggers: ["refactor", "improve", "clean", "optimize", "rename"]
    tools: ["file-ops", "project-analysis"]

  release:
    description: "Prepares releases, manages versions, publishes packages"
    triggers: ["release", "publish", "version", "changelog", "tag"]
    tools: ["git-ops", "file-ops", "shell"]

  healer:
    description: "Recovers from failures, retries with different approaches"
    triggers: []  # Automatic on failure
    tools: ["shell", "file-ops", "project-analysis", "system-info"]  # Limited, not "*"
    limits:
      max_retries: 3
      cannot_self_invoke: true
      escalate_after_retries: true

  data:
    description: "Analyzes data, generates statistics, runs ML inference"
    triggers: ["data", "csv", "statistics", "analyze data", "dataframe"]
    tools: ["python-data", "python-ml"]
```

## Slash Command Definition

### .claude/commands/flynn.md

```markdown
---
description: Flynn AI Orchestrator - Single entry point for all development tasks
allowed-tools: mcp__flynn
model: opus
argument-hint: <task description>
---

Execute the Flynn orchestrator for the given task.

Task: $ARGUMENTS

The Flynn orchestrator will:
1. Analyze your request
2. Route to the appropriate specialized agent
3. Execute the task with necessary tools
4. Return results or ask for clarification

Available capabilities:
- install/setup: Install dependencies and configure environment
- diagnose/debug: Diagnose and debug issues
- create/scaffold: Generate new projects or components
- implement/code: Write and modify code
- refactor/improve: Improve code quality
- release/publish: Prepare releases
- data/analyze: Data analysis tasks
```

## Orchestrator System Prompt

### orchestrator.ts Instructions

```typescript
export const orchestratorInstructions = `
You are Flynn, an autonomous AI development orchestrator.

## Your Role
Route incoming requests to specialized sub-agents based on intent analysis.
You coordinate a network of expert agents, each with specific capabilities.

## Available Agents
- installer: Setup, installation, dependency management
- diagnostic: Debugging, error analysis, troubleshooting
- scaffolder: Project generation, boilerplate creation
- coder: Code writing, feature implementation
- refactor: Code improvement, optimization, cleanup
- release: Version management, changelog, publishing
- healer: Automatic error recovery (triggered on failure)
- data: Data analysis, statistics, ML tasks

## Routing Rules
1. Parse the user's request for intent keywords
2. Match against agent triggers from capabilities.yaml
3. If single match: route directly
4. If multiple matches: score by relevance and pick best
5. If no match: ask user for clarification
6. On agent failure: invoke healer agent

## Language Rules
- Respond in the user's language
- Code, comments, variables: always English
- Internal logs: English

## Response Format
- Be concise and action-oriented
- Report which agent is handling the task
- Stream progress updates
- Summarize results clearly

## Constraints
- Never execute dangerous shell commands
- Respect flynn.policy.yaml permissions
- Maximum 10 agent iterations per request
- Timeout after 5 minutes
`.trim();
```

## Agent Instructions

Each sub-agent requires specific instructions for its domain:

### installer.ts Instructions

```typescript
export const installerInstructions = `
You are the Flynn Installer Agent.

## Responsibilities
- Install Node.js, pnpm, Python, uv, and other dependencies
- Configure Claude Code CLI
- Set up development environment
- Manage package installations

## Tools Available
- shell: Execute installation commands
- file-ops: Create configuration files
- git-ops: Clone repositories, manage remotes

## Constraints
- All installations must be idempotent
- Check if already installed before installing
- Use XDG-compliant paths
- Never use sudo without explicit permission

## Output
Report installation status for each component.
`.trim();
```

### diagnostic.ts Instructions

```typescript
export const diagnosticInstructions = `
You are the Flynn Diagnostic Agent.

## Responsibilities
- Analyze error messages and stack traces
- Identify root causes of issues
- Suggest fixes and workarounds
- Check system configuration

## Tools Available
- project-analysis: Examine project structure
- system-info: Get environment details
- shell: Run diagnostic commands

## Approach
1. Gather context (error logs, config files)
2. Identify patterns and common issues
3. Propose actionable solutions
4. Verify if fix resolves the issue

## Output
Structured diagnosis with cause, impact, and solution.
`.trim();
```

### scaffolder.ts Instructions

```typescript
export const scaffolderInstructions = `
You are the Flynn Scaffolder Agent.

## Responsibilities
- Generate new project structures
- Create boilerplate code
- Set up build configurations
- Initialize git repositories

## Tools Available
- file-ops: Create files and directories
- git-ops: Initialize repos, create commits
- shell: Run scaffolding commands

## Templates
Support common project types:
- TypeScript library (pnpm, Biome, vitest)
- Python package (uv, ruff, pytest)
- Full-stack app (Next.js, FastAPI)

## Output
List of created files with brief descriptions.
`.trim();
```

### coder.ts Instructions

```typescript
export const coderInstructions = `
You are the Flynn Coder Agent.

## Responsibilities
- Implement features based on specifications
- Write clean, maintainable code
- Follow project conventions
- Add appropriate tests

## Tools Available
- file-ops: Read/write source files
- project-analysis: Understand codebase structure

## Principles
- KISS: Simplest solution first
- DRY: Avoid code duplication
- Single Responsibility: One function, one purpose
- Test coverage for new code

## Output
Show code changes with explanations.
`.trim();
```

### refactor.ts Instructions

```typescript
export const refactorInstructions = `
You are the Flynn Refactor Agent.

## Responsibilities
- Improve code structure without changing behavior
- Reduce technical debt
- Optimize performance
- Enhance readability

## Tools Available
- file-ops: Modify source files
- project-analysis: Find refactoring opportunities

## Patterns
- Extract functions/classes
- Rename for clarity
- Remove dead code
- Simplify conditionals

## Output
Before/after comparisons with rationale.
`.trim();
```

### release.ts Instructions

```typescript
export const releaseInstructions = `
You are the Flynn Release Agent.

## Responsibilities
- Prepare releases (version bumps)
- Generate changelogs
- Create release tags
- Publish packages

## Tools Available
- git-ops: Tags, commits, version management
- file-ops: Update version files, changelogs
- shell: Run publish commands

## Workflow
1. Determine version bump (major/minor/patch)
2. Update version in package files
3. Generate changelog from commits
4. Create git tag
5. (Optional) Publish to registry

## Output
Release summary with version and changelog.
`.trim();
```

### healer.ts Instructions

```typescript
export const healerInstructions = `
You are the Flynn Healer Agent.

## Responsibilities
- Automatically recover from agent failures
- Diagnose why other agents failed
- Retry with different approaches
- Escalate to user if unrecoverable

## Tools Available
- shell: Run diagnostic/fix commands
- file-ops: Check/fix configuration files
- project-analysis: Examine project state
- system-info: Check environment

## Limits
- Maximum 3 retry attempts
- Cannot invoke yourself (no recursive healing)
- Must escalate to user after max retries

## Recovery Strategies
1. Analyze failure context and error
2. Check if it's a transient issue (retry)
3. Check if it's a configuration issue (fix config)
4. Check if it's a missing dependency (install)
5. If unrecoverable after 3 attempts: explain and ask user

## Output
Recovery report or escalation request.
`.trim();
```

### data.ts Instructions

```typescript
export const dataInstructions = `
You are the Flynn Data Agent.

## Responsibilities
- Analyze datasets (CSV, JSON)
- Generate statistics and insights
- Create visualizations
- Run ML inference

## Tools Available
- python-data: pandas operations (load, filter, aggregate)
- python-ml: ML models (sentiment, summarize, classify)

## Approach
1. Load and inspect data
2. Clean and preprocess
3. Analyze and summarize
4. Present findings

## Output
Data insights with statistics and recommendations.
`.trim();
```

## Orchestrator Routing Logic

```
Input: "/flynn {user_prompt}"
                │
                ▼
        ┌───────────────┐
        │  Parse Prompt │
        └───────┬───────┘
                │
                ▼
        ┌───────────────────────────┐
        │  Match against triggers   │
        │  from capabilities.yaml   │
        └───────────┬───────────────┘
                    │
        ┌───────────┴───────────────┐
        │                           │
        ▼                           ▼
   Single Match              Multiple Matches
        │                           │
        ▼                           ▼
   Route to Agent           Score by relevance
        │                           │
        │                           ▼
        │                    Route to best
        │                           │
        └───────────┬───────────────┘
                    │
                    ▼
            ┌───────────────┐
            │ Execute Agent │
            └───────┬───────┘
                    │
            ┌───────┴───────┐
            │               │
            ▼               ▼
         Success         Failure
            │               │
            ▼               ▼
         Return        Healer Agent
                            │
                            ▼
                      Retry or Report
```

## Error Handling

| Error Type | Handler | Action |
|------------|---------|--------|
| Agent timeout | Orchestrator | Cancel + report |
| Tool failure | Healer Agent | Diagnose + retry |
| Missing dependency | Installer Agent | Auto-install |
| Permission denied | Policy check | Deny + explain |
| Unknown intent | Orchestrator | Ask user |

## Model Configuration

Default: `anthropic/claude-opus-4-5-20251101`

Override with `FLYNN_AGENT_MODEL`:
- `anthropic/claude-opus-4-5-20251101` (default, maximum intelligence)
- `anthropic/claude-4-5-sonnet` (balanced, cost-efficient)
- `anthropic/claude-haiku-4-5-20251001` (fast, high-volume)
- `openai/gpt-4o`
- `ollama/llama3.2`

### Anthropic Model Pricing

| Model | Input | Output | Use Case |
|-------|-------|--------|----------|
| Opus 4.5 | $15/MTok | $75/MTok | Default, maximum intelligence |
| Sonnet 4.5 | $3/MTok | $15/MTok | Balanced, cost-efficient |
| Haiku 4.5 | $1/MTok | $5/MTok | Fast, high-volume |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key | Required |
| `FLYNN_AGENT_MODEL` | Override agent model | anthropic/claude-opus-4-5-20251101 |
| `FLYNN_ENABLE_PYTHON_MCP` | Enable Python tools | false |
| `FLYNN_POLICY_PATH` | Custom policy file | config/flynn.policy.yaml |
| `FLYNN_LOG_LEVEL` | Log level | info |
| `XDG_DATA_HOME` | Data directory | ~/.local/share |
| `XDG_CONFIG_HOME` | Config directory | ~/.config |

## Installation Flow

### Voraussetzungen

**Mindestens eine dieser Optionen:**
- Node.js >=20 bereits installiert → `npx @flynn/bootstrap`
- Nur curl/bash verfügbar → Shell-Script (installiert Node automatisch)

### Option A: npx (wenn Node vorhanden)

```
User runs: npx @flynn/bootstrap
                │
                ▼
        ┌───────────────────┐
        │  Detect Environment│
        │  (WSL2, versions)  │
        └─────────┬─────────┘
                  │
                  ▼
        ┌───────────────────┐
        │  Check existing   │
        │  installations    │
        └─────────┬─────────┘
                  │
                  ▼
        ┌───────────────────┐
        │  Install missing  │
        │  (idempotent)     │
        │  - Node.js        │
        │  - pnpm           │
        │  - Python + uv    │
        │  - Claude Code    │
        │  - Agent SDKs     │
        └─────────┬─────────┘
                  │
                  ▼
        ┌───────────────────┐
        │  Configure paths  │
        │  (XDG compliant)  │
        └─────────┬─────────┘
                  │
                  ▼
        ┌───────────────────┐
        │  Validate install │
        └─────────┬─────────┘
                  │
                  ▼
        ┌───────────────────┐
        │  Generate report  │
        └───────────────────┘
```

### Option B: Shell-Script (ohne Node)

```bash
curl -fsSL https://raw.githubusercontent.com/<github-user>/flynn-project/main/install.sh | bash
```

> **Note:** Replace `<github-user>` with the actual GitHub username/organization.

**install.sh Inhalt:**
```bash
#!/usr/bin/env bash
set -euo pipefail

FLYNN_VERSION="1.0.0"
MIN_NODE_VERSION="20"

echo "Flynn Bootstrap Installer v${FLYNN_VERSION}"

# Check for Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge "$MIN_NODE_VERSION" ]; then
        echo "✓ Node.js v$(node -v) found"
        npx @flynn/bootstrap "$@"
        exit 0
    fi
fi

echo "Node.js >= ${MIN_NODE_VERSION} not found. Installing..."

# Detect OS and install Node
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Install via n (Node version manager)
    curl -fsSL https://raw.githubusercontent.com/tj/n/master/bin/n | bash -s lts
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS: use n or brew
    curl -fsSL https://raw.githubusercontent.com/tj/n/master/bin/n | bash -s lts
fi

# Run bootstrap
npx @flynn/bootstrap "$@"
```

## Development Phases

### Phase 1: Foundation
- [ ] Monorepo setup (pnpm workspace)
- [ ] @flynn/core package
- [ ] @flynn/tools package (migrate existing)
- [ ] apps/server (migrate existing)

### Phase 2: Bootstrap
- [ ] @flynn/bootstrap package
- [ ] Environment detectors
- [ ] Installers (Claude Code, SDKs)
- [ ] Validators

### Phase 3: Agents
- [ ] @flynn/agents package
- [ ] Orchestrator with routing
- [ ] Sub-agents (installer, diagnostic, scaffolder, coder, refactor, release)
- [ ] Healer agent

### Phase 4: Integration
- [ ] /flynn slash command
- [ ] flynn.policy.yaml enforcement
- [ ] capabilities.yaml routing
- [ ] Python package restructure

### Phase 5: Polish
- [ ] Documentation
- [ ] Tests
- [ ] GitHub Actions CI/CD
- [ ] README + Installation guide

## Tool Registration Pattern

### createTool() Usage

All tools are registered using Mastra's `createTool()` function with Zod schemas:

```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Example: project-analysis.ts
export const analyzeProjectTool = createTool({
  id: "analyze-project",
  description: "Analyze project directory structure and provide insights",
  inputSchema: z.object({
    projectPath: z.string().describe("Path to the project directory"),
    maxDepth: z.number().default(3).describe("Maximum directory depth to scan"),
  }),
  outputSchema: z.object({
    name: z.string(),
    type: z.string(),
    files: z.number(),
    directories: z.number(),
    languages: z.array(z.string()),
    frameworks: z.array(z.string()),
  }),
  execute: async (inputData) => {
    const { projectPath, maxDepth } = inputData;
    // Implementation
    return { name: "...", type: "...", /* ... */ };
  },
});

// Example: shell.ts (safe execution)
export const shellTool = createTool({
  id: "shell",
  description: "Execute safe shell commands",
  inputSchema: z.object({
    command: z.string().describe("Shell command to execute"),
    cwd: z.string().optional().describe("Working directory"),
  }),
  outputSchema: z.object({
    stdout: z.string(),
    stderr: z.string(),
    exitCode: z.number(),
  }),
  execute: async (inputData) => {
    const { command, cwd } = inputData;
    // Validate against flynn.policy.yaml before execution
    // Implementation with spawn
    return { stdout: "", stderr: "", exitCode: 0 };
  },
});
```

### Tool Registry in Server

```typescript
// apps/server/src/server.ts
import { MCPServer } from "@mastra/mcp";
import { analyzeProjectTool, systemInfoTool } from "@flynn/tools";
import { orchestrator } from "@flynn/agents";

const server = new MCPServer({
  id: "flynn-mcp-server",
  name: "Flynn AI Orchestrator",
  version: "1.0.0",
  tools: {
    analyzeProjectTool,
    systemInfoTool,
    // ... more tools
  },
  agents: {
    orchestrator, // Becomes ask_orchestrator
  },
});
```

## Mastra Agent Network Pattern

The orchestrator uses Mastra's Agent Network for multi-agent coordination:

```typescript
// packages/agents/src/orchestrator.ts
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { anthropic } from "@ai-sdk/anthropic";
import { getMemoryDbPath } from "@flynn/core";
import { orchestratorInstructions } from "./instructions.js";
import { installer, diagnostic, scaffolder, coder, refactor, release, healer, data } from "./index.js";
import { analysisWorkflow, bootstrapWorkflow } from "./workflows/index.js";

// Memory storage path (XDG compliant via @flynn/core)
const memoryPath = getMemoryDbPath();

const memory = new Memory({
  storage: new LibSQLStore({
    id: "flynn-memory",
    url: `file:${memoryPath}`,
  }),
  options: {
    lastMessages: 20,
  },
});

export const orchestrator = new Agent({
  id: "flynn-orchestrator",
  name: "Flynn",
  description: "AI development orchestrator that routes tasks to specialized agents",
  model: anthropic("claude-opus-4-5-20251101"),
  instructions: orchestratorInstructions,
  memory,

  // Sub-agents for delegation via Agent Network
  agents: [installer, diagnostic, scaffolder, coder, refactor, release, healer, data],

  // Workflows for multi-step operations
  workflows: {
    analysisWorkflow,
    bootstrapWorkflow,
  },
});
```

### Agent Execution Methods

Mastra bietet zwei Aufruf-Methoden mit unterschiedlichen Anwendungsfällen:

| Methode | Toolsets | Streaming | Use Case |
|---------|----------|-----------|----------|
| `generate()` | ✓ | Text only | Standard-Aufruf mit dynamischen MCP-Tools |
| `stream()` | ✓ | Full | Streaming mit dynamischen MCP-Tools |
| `network()` | ✗ | Events | Internes Multi-Agent-Routing (ohne externe Tools) |

```typescript
// Empfohlen: generate() mit toolsets für externe MCP-Tools
const response = await orchestrator.generate(userPrompt, {
  toolsets: await externalMcpClient.listToolsets(),
  memory: { resource: "user", thread: "session-123" },
});

// Alternative: stream() für Streaming-Responses
const stream = await orchestrator.stream(userPrompt, {
  toolsets: await externalMcpClient.listToolsets(),
});

for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}

// Nur für internes Routing ohne externe MCP-Tools
const result = await orchestrator.network(userPrompt);
for await (const chunk of result) {
  if (chunk.type === "network-execution-event-step-finish") {
    console.log(chunk.payload.result);
  }
}
```

### Sub-Agent Definition Example

```typescript
// packages/agents/src/installer.ts
import { Agent } from "@mastra/core/agent";
import { shellTool, fileOpsTool, gitOpsTool } from "@flynn/tools";
import { installerInstructions } from "./instructions.js";

export const installer = new Agent({
  id: "flynn-installer",
  name: "Installer Agent",
  description: "Handles installation, setup, and dependency management tasks",
  instructions: installerInstructions,
  model: process.env.FLYNN_AGENT_MODEL || "anthropic/claude-opus-4-5-20251101",
  tools: {
    shellTool,
    fileOpsTool,
    gitOpsTool,
  },
});
```

## Agent Memory Configuration

Der Orchestrator verwendet Mastra Memory für Kontext-Persistenz (siehe vollständige Definition oben).

### Memory-Aufruf mit Kontext

```typescript
// Bei jedem /flynn Aufruf (mit optionalen externen MCP-Tools)
const response = await orchestrator.generate(userPrompt, {
  toolsets: externalToolsets, // Optional: Externe MCP-Tools (siehe Future Extensions)
  memory: {
    resource: "user-session",      // User-Identifier
    thread: `session-${Date.now()}`, // Session-Identifier
  },
});
```

### Memory-Typen

| Typ | Zweck | Konfiguration |
|-----|-------|---------------|
| **Conversation History** | Letzte N Messages | `lastMessages: 20` |
| **Working Memory** | Persistente User-Info | `workingMemory: { enabled: true }` |
| **Semantic Recall** | Ähnliche vergangene Queries | `semanticRecall: { topK: 3 }` |

Für v1 ist **Conversation History** ausreichend. Working Memory und Semantic Recall können später aktiviert werden.

## Test Strategy

### Unit Tests (vitest)

```typescript
// packages/tools/src/__tests__/project-analysis.test.ts
import { describe, it, expect } from "vitest";
import { analyzeProjectTool } from "../project-analysis.js";

describe("analyzeProjectTool", () => {
  it("should analyze a TypeScript project", async () => {
    const result = await analyzeProjectTool.execute(
      { projectPath: "./fixtures/ts-project", maxDepth: 2 }
    );
    expect(result.languages).toContain("typescript");
  });
});
```

### Agent Evals (Mastra)

```typescript
// packages/agents/src/__tests__/orchestrator.eval.ts
import { runEvals, createScorer } from "@mastra/core/evals";
import { orchestrator } from "../orchestrator.js";

// Mastra v1 Evals API: createScorer with chainable generateScore()
const routingScorer = createScorer({
  id: "routing-accuracy",
  name: "Routing Accuracy",
  description: "Evaluates if orchestrator routes to correct agent",
  type: "agent",
}).generateScore(({ run }) => {
  const response = run.output[0]?.content || "";
  const expectedAgent = run.groundTruth;
  const routedTo = response.match(/Routing to: (\w+)/)?.[1];
  return routedTo === expectedAgent ? 1 : 0;
});

// Mastra v1: target (not agent), data (not testCases), groundTruth (not expected)
const result = await runEvals({
  target: orchestrator,
  data: [
    { input: "Install pnpm on my system", groundTruth: "installer" },
    { input: "Why is my build failing?", groundTruth: "diagnostic" },
    { input: "Create a new React project", groundTruth: "scaffolder" },
    { input: "Implement a login function", groundTruth: "coder" },
    { input: "Clean up this messy code", groundTruth: "refactor" },
    { input: "Prepare v2.0.0 release", groundTruth: "release" },
    { input: "Analyze the sales CSV data", groundTruth: "data" },
  ],
  scorers: [routingScorer],
  concurrency: 2,
});

console.log(`Average routing accuracy: ${result.scores["routing-accuracy"]}`);
```

### Integration Tests

```typescript
// apps/server/src/__tests__/mcp-server.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn } from "child_process";

describe("Flynn MCP Server", () => {
  let server: ReturnType<typeof spawn>;

  beforeAll(async () => {
    server = spawn("node", ["dist/server.js"]);
    await new Promise((r) => setTimeout(r, 2000)); // Wait for startup
  });

  afterAll(() => {
    server.kill();
  });

  it("should expose analyze-project tool", async () => {
    // Send MCP tool list request
    // Verify tool is present
  });
});
```

### CI Pipeline (GitHub Actions)

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
      - run: pnpm test
      - run: pnpm lint

  evals:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
      - run: pnpm install && pnpm build
      - run: pnpm --filter @flynn/agents eval
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Future Extensions

Externe MCP Server können nachträglich via Plugin-System integriert werden:

```typescript
// packages/core/src/mcp-registry.ts
import { MCPClient } from "@mastra/mcp";

// Registry für externe MCP Server
export const externalMcpClient = new MCPClient({
  servers: {
    "context7": { command: "npx", args: ["-y", "@context7/mcp"] },
    "exa": { command: "npx", args: ["-y", "@exa/mcp"] },
    "custom-server": { url: new URL("https://mcp.example.com/sse") },
  },
});

// Toolsets für dynamische Injection abrufen
export const getExternalToolsets = () => externalMcpClient.listToolsets();
```

### Dynamic Toolset Injection

Externe MCP-Tools werden zur Laufzeit via `toolsets` Parameter injiziert:

```typescript
// apps/server/src/handler.ts
import { orchestrator } from "@flynn/agents";
import { getExternalToolsets } from "@flynn/core";

export async function handleFlynnRequest(userPrompt: string) {
  // Orchestrator mit dynamischen MCP-Tools aufrufen
  const response = await orchestrator.generate(userPrompt, {
    toolsets: await getExternalToolsets(),
    memory: {
      resource: "user-session",
      thread: `session-${Date.now()}`,
    },
  });

  return response.text;
}
```

> **Note:** `generate()` mit `toolsets` ermöglicht dynamische Tool-Injection.
> Die interne Agent-Delegation (via `agents: {}`) funktioniert weiterhin.

**Nicht im Scope der initialen Implementierung** da API-Key-abhängig.

## Development Notes

- **Umsetzung:** Option B - vollständig implementiert + getestet
- **Entwicklung:** Parallel zu bestehendem Flynn (`/home/c/projects/Flynn`)
- **Ziel-Ort:** `/home/c/projects/Flynn-Project`
- **GitHub:** Repo muss LICENSE, .gitignore, README.md enthalten

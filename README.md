<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/flynn-logo-simple.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/flynn-logo-simple.svg">
  <img src="assets/flynn-logo-simple.svg" alt="Flynn - Expert System for Claude Code" width="700">
</picture>

# Flynn · Expert System for Claude Code

Pilot 27 specialized agents for Claude Code — **no API keys**. Local-first, token-slim, workflow-ready.

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](#)
[![Build](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![Node](https://img.shields.io/badge/node-20%2B-yellow)](#)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](#)
[![Status](https://img.shields.io/badge/status-active-success)](#)

`User → Claude Code → Flynn MCP Server → Specialized Agents → Result`

</div>

> **Why Flynn exists**
> Claude Code has the LLM. Flynn supplies the expertise: 27 agent contexts, 22 workflows, and 18 MCP tools — all local, no secrets, no telemetry.

## Navigation

- Signals
- System Map
- Flight Plan
- Wiring Claude Code
- Command Patterns
- Agent Roster & Workflows
- Integration & Security
- Develop / Operate
- Architecture Map
- Docs & Contribute

## Signals (What makes Flynn different)

- **27 curated agent contexts** (coder, diagnostic, security, ml-engineer, blockchain-developer, orchestrator, …)
- **22 multi-agent workflows** for real delivery work (bugfix, full-stack-feature, security-hardening, incident-response, migrations, codex-integration)
- **18 MCP tools**: routing, git/file/shell, skills, analytics, health, external MCP discovery, codex integration
- **17 skills with progressive disclosure**: debugging, TDD, planning, security, prompt engineering, and more
- Local-first and offline-capable; zero API keys; policy profiles baked in
- Token-efficient progressive disclosure (typ. 70–90% savings); hybrid models: opus · sonnet · haiku

## System Map

```
User
  ↳ Claude Code
      ↳ Flynn MCP Server (routing, policy, analytics)
          ↳ Agent contexts (27)
          ↳ Workflows (22)
          ↳ MCP tools (18)
          ↳ Skills (17)
              ↳ Result
```

## Flight Plan (Quick Start)

### Recommended: Automated Installer

```bash
# Download installer
curl -fsSL https://raw.githubusercontent.com/reze83/Flynn-Project/main/install-flynn.sh -o install-flynn.sh

# Make executable and run
chmod +x install-flynn.sh
./install-flynn.sh
```

The installer handles everything: dependencies, building, Claude Code configuration, and verification.

### Manual Installation

```bash
git clone https://github.com/reze83/Flynn-Project.git
cd Flynn-Project
```

```bash
# Install dependencies. This script tries pnpm first and falls back to npm when pnpm is absent.
npm run install:local

# Build all packages
pnpm build

# Launch MCP server
pnpm --filter @flynn/server start
```

> **Hinweis:** Sollte `pnpm` nicht installiert sein, nutzt das Skript `install:local` automatisch `npm install`. Dies erleichtert die Installation auf Systemen ohne pnpm.

> **Note:** The repository includes a `.npmrc` file that configures pnpm to allow build scripts. If you see warnings about ignored build scripts, they can be safely ignored—all tools function correctly.

**Requirements:** Node.js 20+, pnpm 9+, Python 3.11+ (optional for data/ML tools)

## Wire Claude Code

**MCP Server (global)** – `~/.claude.json`  
Add the Flynn server definition here. Claude Code reads `mcpServers` from this file.

```json
{
  "mcpServers": {
    "flynn": {
      "type": "stdio",
      "command": "node",
      "args": ["<PATH_TO_FLYNN>/apps/server/dist/server.js"]
    }
  }
}
```

> Replace `<PATH_TO_FLYNN>` with your actual installation path, e.g., `/home/user/Flynn-Project`

**Tool-Allowlist (global)** – `~/.claude/settings.json`  
Allow Flynn tools here (Claude reads `permissions.allow` from this file).

```json
{
  "permissions": {
    "allow": [
      "mcp__flynn__analyze-project",
      "mcp__flynn__system-info",
      "mcp__flynn__route-task",
      "mcp__flynn__get-agent-context",
      "mcp__flynn__orchestrate",
      "mcp__flynn__list-workflows",
      "mcp__flynn__heal-error",
      "mcp__flynn__git-ops",
      "mcp__flynn__file-ops",
      "mcp__flynn__shell",
      "mcp__flynn__get-skill",
      "mcp__flynn__list-skills",
      "mcp__flynn__generate-hooks",
      "mcp__flynn__health-check",
      "mcp__flynn__analytics",
      "mcp__flynn__list-mcp-tools",
      "mcp__flynn__codex-delegate",
      "mcp__flynn__codex-md-generator"
    ]
  }
}
```

**Tool-Allowlist (project)** – `.claude/settings.local.json`  
Use the same `permissions.allow` block here if you want project-scoped allowlists.

## Command Patterns

**Single agent**

```bash
/flynn fix the authentication bug
# Flynn routes to the diagnostic agent automatically
```

**Multi-agent workflow**

```bash
/flynn build full stack user authentication
# Orchestrates: api-designer → database-architect → coder → frontend-architect → test-architect → security → devops-engineer
```

### CLI Workflows

Mit dem neuen `flynn run`-Befehl können Sie Workflows direkt aus der Kommandozeile planen und ausführen. Wenn keine Aufgabe angegeben wird, fragt ein Assistent interaktiv nach dem Task.

```bash
# Planen Sie einen Workflow für eine Aufgabe und führen Sie ihn anschließend aus
flynn run -t "migrate project to React 18" --execute

# Interaktiv: Beschreibt eine Aufgabe und wählt dann die Ausführung aus
flynn run --execute
```

### Sicherheitsprüfung

Der Befehl `flynn scan` durchsucht eine JavaScript/TypeScript‑Datei nach gefährlichen Funktionen wie `eval` oder `child_process.exec`【430188905619224†L703-L713】.

```bash
# Eine Datei auf unsichere Funktionen prüfen
flynn scan src/app.ts
```

### Cache‑Management

Persistente Caches für Embeddings, RAG‑Suchergebnisse und Projektanalysen können mit dem folgenden Befehl gelöscht werden:

```bash
# Caches im Ordner .flynn_cache löschen
flynn cache clear
```

**Direct MCP tools**

```bash
mcp__flynn__route-task({ "message": "optimize database queries" })
mcp__flynn__get-agent-context({ "task": "security audit", "agent": "security" })
mcp__flynn__orchestrate({ "task": "migrate from React 17 to 18" })
mcp__flynn__health-check({ "checks": ["all"] })
```

## Agent Roster (by category)

| Category | Agents | Model |
|----------|--------|-------|
| **Core** | coder, diagnostic, scaffolder, installer, refactor, release, healer, data, security, reviewer, performance | haiku/sonnet |
| **Architecture** | system-architect, database-architect, frontend-architect, api-designer | opus/sonnet |
| **Operations** | devops-engineer, terraform-expert, kubernetes-operator, incident-responder | haiku/sonnet |
| **Specialized** | migration-specialist, test-architect, documentation-architect, ml-engineer, data-engineer, mobile-developer, blockchain-developer | opus/sonnet |
| **Integration** | orchestrator (Codex delegation) | sonnet |

## Workflow Library

| Workflow | Agents | Use case |
|----------|--------|----------|
| new-project | scaffolder → coder → diagnostic | Start a new codebase |
| fix-bug | diagnostic → coder → diagnostic | Bug investigation & fix |
| full-stack-feature | 7 agents | End-to-end feature dev |
| security-hardening | security → reviewer → diagnostic → coder | Security upgrades |
| incident-response | diagnostic → incident-responder → coder → healer | Production incidents |
| codebase-migration | 6 agents | Framework migrations |
| codex-delegation | orchestrator → coder → diagnostic | Delegate to Codex CLI |

[All 22 workflows →](docs/WORKFLOWS.md)

## Codex Integration

Flynn provides seamless integration with OpenAI Codex CLI through two specialized tools:

- **`codex-delegate`**: Delegate tasks to Codex with context handoff, session management, and live monitoring
- **`codex-md-generator`**: Generate CODEX.md files with role-based templates and task-specific context

### Real-time Monitoring

Codex delegations now feature **live logging and status tracking**:

```bash
# All Codex sessions log to:
~/.flynn/codex-sessions/{sessionId}.log      # Real-time output
~/.flynn/codex-sessions/{sessionId}.status   # Current status (running/completed/failed/timeout)
```

**Monitor progress live:**

```bash
# Watch Codex work in real-time
tail -f ~/.flynn/codex-sessions/*.log

# Check status
cat ~/.flynn/codex-sessions/*.status
```

**Usage example:**

```javascript
// Delegate task to Codex
const result = await mcp__flynn__codex_delegate({
  operation: "delegate",
  task: "Create React component with TypeScript",
  timeout: 300000,
  workingDir: "/home/user/project"
});

// Response includes:
// - sessionId: Track this task
// - logFile: Path to live output
// - statusFile: Path to status JSON
// - liveStatus: { status: "running", timestamp, details }

// Check status later
const status = await mcp__flynn__codex_delegate({
  operation: "status",
  sessionId: result.sessionId
});
// Returns live status even if connection timed out
```

**Key features:**

- ✅ Stream Codex output to log files in real-time
- ✅ Status files update automatically (running → completed/failed)
- ✅ Session IDs returned on timeout for status checking
- ✅ Monitor multiple Codex tasks simultaneously
- ✅ Automatic completion detection—tasks end naturally, no infinite loops

## External MCP Integration

Flynn auto-discovers and recommends tools from:

- Environment variable `FLYNN_MCP_TOOLS`
- Config file `~/.flynn/mcp-tools.json`
- Claude settings `~/.claude/settings.json` (auto-discovery)

Examples:

```bash
mcp__flynn__list-mcp-tools({ "category": "search" })
mcp__flynn__get-agent-context({ "task": "research api", "agent": "documentation-architect" })
```

## Security Posture

```bash
export FLYNN_POLICY_PROFILE=strict   # default | strict | airgapped
```

- **default:** standard protections
- **strict:** disables network-based tools
- **airgapped:** maximum isolation (file operations only)

## Develop / Operate

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

**Component runs**

```bash
# MCP Server
pnpm --filter @flynn/server build && pnpm --filter @flynn/server start

# CLI
pnpm --filter @flynn/cli build && pnpm --filter @flynn/cli start

# Dashboard (port 3001)
cd apps/dashboard && pnpm start

# Python MCP tools
cd packages/python && uv run python -m server
```

## Ship / Release

```bash
pnpm version patch     # bump (patch|minor|major) as needed
pnpm publish           # publish package artifacts if applicable
```

If you deploy the MCP server somewhere central, document the node path you use in settings. Keep CHANGELOG.md in sync with releases.

## Architecture (repo map)

```
flynn/
├── apps/
│   ├── server/         # MCP server (entry point)
│   ├── cli/            # Analytics + health CLI
│   └── dashboard/      # Static analytics dashboard
├── packages/
│   ├── core/           # Logging, policy, paths, types
│   ├── tools/          # MCP tools
│   ├── agents/         # Agent contexts and workflows
│   ├── analytics/      # Usage tracking (LibSQL)
│   ├── plugins/        # Plugin framework
│   ├── plugins-core/   # Core plugins (e.g., security-scanner)
│   ├── bootstrap/      # Environment detection
│   └── python/         # Python MCP tools (data/ML)
├── config/             # Policy profiles
└── docs/               # Architecture & references
```

## Skills Library

Flynn includes 17 skills with progressive disclosure for token-efficient specialized knowledge:

| Category | Skills |
|----------|--------|
| **Development** (5) | typescript-advanced, python-patterns, systematic-debugging, root-cause-tracing, mcp-builder |
| **Architecture** (1) | api-design |
| **DevOps** (2) | kubernetes-ops, terraform-iac |
| **Testing** (3) | testing-strategies, test-driven-development, verification-before-completion |
| **Productivity** (4) | brainstorming, writing-plans, executing-plans, dispatching-parallel-agents |
| **Security** (1) | defense-in-depth |
| **AI** (1) | prompt-engineering |

[All 17 skills →](docs/SKILLS.md)

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — System design and data flow
- [docs/AGENTS.md](docs/AGENTS.md) — All 27 agents with capabilities
- [docs/TOOLS.md](docs/TOOLS.md) — All 18 MCP tools with schemas
- [docs/SKILLS.md](docs/SKILLS.md) — All 17 skills with progressive disclosure
- [docs/WORKFLOWS.md](docs/WORKFLOWS.md) — All 22 multi-agent workflows
- [docs/MULTI-AGENT-EXAMPLES.md](docs/MULTI-AGENT-EXAMPLES.md) — Complex workflow examples
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) — Common issues and solutions
- [config/POLICY-PROFILES.md](config/POLICY-PROFILES.md) — Security configuration
- [CONTRIBUTING.md](CONTRIBUTING.md) — How to contribute
- [CHANGELOG.md](CHANGELOG.md) — Version history

## Contribute

Pull requests welcome. Please open an issue for major changes and align on policy profile defaults. Run `pnpm lint && pnpm typecheck && pnpm test` before submitting.

## Why Flynn (at a glance)

- No API keys; Claude Code supplies the LLM, Flynn supplies the expertise
- Token-efficient prompting (progressive disclosure saves 70–90%)
- Local-first with zero telemetry
- Composable agents and workflows for real delivery work
- Extensible: add custom agents, skills, plugins

## License

MIT

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

[Quick Start](docs/QUICKSTART.md) · [Documentation](docs/) · [Examples](docs/MULTI-AGENT-EXAMPLES.md) · [Contributing](CONTRIBUTING.md)

</div>

## What is Flynn?

Flynn is an **expert system** for Claude Code that provides:

- **27 specialized agents** (coder, diagnostic, security, ml-engineer, blockchain-developer, orchestrator, …)
- **23 multi-agent workflows** for real delivery (bugfix, full-stack-feature, security-hardening, incident-response, migrations)
- **18 MCP tools** (routing, git/file/shell, skills, analytics, health, codex integration)
- **17 skills** with progressive disclosure (debugging, TDD, planning, security, prompt engineering)
- **Local-first**, offline-capable, zero API keys, policy profiles baked in
- **Token-efficient** progressive disclosure (70–90% savings)

> **Why Flynn?**
> Claude Code has the LLM. Flynn supplies the expertise: curated agent contexts, workflows, and tools — all local, no secrets, no telemetry.

## Quick Start

### Automated Installation (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/reze83/Flynn-Project/main/install-flynn.sh -o install-flynn.sh
chmod +x install-flynn.sh
./install-flynn.sh
```

The installer handles dependencies, building, Claude Code configuration, and verification.

### Manual Installation

```bash
git clone https://github.com/reze83/Flynn-Project.git
cd Flynn-Project
pnpm install && pnpm build
```

**Configuration:**
1. Add Flynn MCP server to `~/.claude.json`
2. Allow Flynn tools in `~/.claude/settings.json`
3. Restart Claude Code

📖 **[Full Setup Guide](docs/QUICKSTART.md)**

## Usage Examples

### Simple Bug Fix

```bash
/flynn fix the authentication bug
```

### Multi-Agent Workflow

```bash
/flynn build full stack user authentication
```

Orchestrates 7 agents: api-designer → database-architect → coder → frontend-architect → test-architect → security → devops-engineer

### Code Review

```bash
/flynn review the payment processing module
```

Triggers parallel review: reviewer (quality) + security (vulnerabilities) + performance (bottlenecks)

## Core Features

### 27 Specialized Agents

| Category | Agents |
|----------|--------|
| **Core** | coder, diagnostic, scaffolder, installer, refactor, release, healer, data, security, reviewer, performance |
| **Architecture** | system-architect, database-architect, frontend-architect, api-designer |
| **Operations** | devops-engineer, terraform-expert, kubernetes-operator, incident-responder |
| **Specialized** | migration-specialist, test-architect, documentation-architect, ml-engineer, data-engineer, mobile-developer, blockchain-developer |
| **Integration** | orchestrator (Codex delegation) |

📖 **[Full Agent Reference](docs/AGENTS.md)**

### 23 Pre-Built Workflows

| Workflow | Use Case |
|----------|----------|
| fix-bug | Bug investigation & fix |
| add-feature | Add new functionality |
| full-stack-feature | End-to-end feature development (7 agents) |
| security-hardening | Security upgrades (4 agents) |
| codebase-migration | Framework migrations (6 agents) |
| documentation-suite | Project documentation (4 agents) |

📖 **[All Workflows](docs/WORKFLOWS.md)** · **[Workflow Examples](docs/MULTI-AGENT-EXAMPLES.md)**

### 18 MCP Tools

**Development:**
- `route-task` - Route tasks to agents
- `get-agent-context` - Get agent instructions
- `orchestrate` - Plan multi-agent workflows

**Operations:**
- `git-ops`, `file-ops`, `shell` - System operations
- `health-check`, `analytics` - Monitoring

**Skills & Learning:**
- `get-skill`, `list-skills` - Progressive disclosure
- `list-mcp-tools` - External MCP discovery

**Integration:**
- `codex-delegate` - Delegate to OpenAI Codex
- `codex-md-generator` - Generate CODEX.md files

📖 **[Full Tool Reference](docs/TOOLS.md)**

## Architecture

```
User
  ↳ Claude Code
      ↳ Flynn MCP Server (routing, policy, analytics)
          ↳ Agent contexts (27)
          ↳ Workflows (23)
          ↳ MCP tools (18)
          ↳ Skills (17)
              ↳ Result
```

**Repository Structure:**

```
Flynn-Project/
├── apps/
│   ├── server/         # MCP server (entry point)
│   ├── cli/            # CLI tools
│   └── dashboard/      # Analytics dashboard
├── packages/
│   ├── core/           # Logging, policy, paths
│   ├── tools/          # MCP tools implementation
│   ├── agents/         # Agent contexts & workflows
│   └── analytics/      # Usage tracking (LibSQL)
├── docs/               # Documentation
└── scripts/            # Build & deployment
```

📖 **[Architecture Guide](docs/ARCHITECTURE.md)**

## Integration

### Codex Integration

Flynn integrates with OpenAI Codex CLI:

```javascript
// Delegate task to Codex with real-time monitoring
mcp__flynn__codex_delegate({
  operation: "delegate",
  task: "Create React component with TypeScript",
  timeout: 300000
});

// Monitor progress live
tail -f ~/.flynn/codex-sessions/*.log
```

**Features:**
- ✅ Live logging and status tracking
- ✅ Session management
- ✅ Context handoff
- ✅ Automatic completion detection

### External MCP Tools

Flynn auto-discovers tools from:
- `FLYNN_MCP_TOOLS` environment variable
- `~/.flynn/mcp-tools.json` config
- `~/.claude/settings.json` (auto-discovery)

## Security

Flynn supports multiple security profiles:

```bash
export FLYNN_POLICY_PROFILE=strict   # default | strict | airgapped
```

- **default:** Standard protections
- **strict:** Disables network-based tools
- **airgapped:** Maximum isolation (file operations only)

📖 **[Security Configuration](config/POLICY-PROFILES.md)**

## Development

```bash
# Run tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Build
pnpm build

# Development mode (watch)
pnpm --filter @flynn/server dev
```

📖 **[Contributing Guide](CONTRIBUTING.md)**

## Documentation

- **[Quick Start Guide](docs/QUICKSTART.md)** - 5-minute setup
- **[Full Documentation](docs/)** - Complete reference
- **[Architecture](docs/ARCHITECTURE.md)** - System design
- **[Agents](docs/AGENTS.md)** - All 27 agents
- **[Workflows](docs/WORKFLOWS.md)** - All 23 workflows
- **[Tools](docs/TOOLS.md)** - All 18 MCP tools
- **[Skills](docs/SKILLS.md)** - All 17 skills
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues
- **[Examples](docs/MULTI-AGENT-EXAMPLES.md)** - Complex patterns

## Requirements

- **Node.js 20+** ([Download](https://nodejs.org/))
- **pnpm 9+** (`npm install -g pnpm`)
- **Python 3.11+** (optional, for data/ML tools)
- **Claude Code CLI** installed

## Contributing

Pull requests welcome! Please:

1. Open an issue for major changes
2. Run `pnpm lint && pnpm typecheck && pnpm test`
3. Follow existing code style
4. Update documentation

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Why Flynn?

- ✅ **No API keys** - Claude Code supplies the LLM, Flynn supplies the expertise
- ✅ **Token-efficient** - Progressive disclosure saves 70–90% tokens
- ✅ **Local-first** - Zero telemetry, works offline
- ✅ **Production-ready** - 27 agents, 23 workflows, 18 tools
- ✅ **Extensible** - Add custom agents, skills, plugins

## License

[MIT](LICENSE) © Flynn Project Contributors

---

**Need Help?** Check [Troubleshooting](docs/TROUBLESHOOTING.md) or open an [Issue](https://github.com/reze83/Flynn-Project/issues).

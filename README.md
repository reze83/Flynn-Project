<div align="center">

```
███████╗██╗  ██╗   ██╗███╗   ██╗███╗   ██╗
██╔════╝██║  ╚██╗ ██╔╝████╗  ██║████╗  ██║
█████╗  ██║   ╚████╔╝ ██╔██╗ ██║██╔██╗ ██║
██╔══╝  ██║    ╚██╔╝  ██║╚██╗██║██║╚██╗██║
██║     ███████╗██║   ██║ ╚████║██║ ╚████║
╚═╝     ╚══════╝╚═╝   ╚═╝  ╚═══╝╚═╝  ╚═══╝
```

**Autonomous AI Agent Orchestrator for Claude Code**

[![CI](https://github.com/reze83/Flynn-Project/actions/workflows/ci.yml/badge.svg)](https://github.com/reze83/Flynn-Project/actions/workflows/ci.yml)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

[Installation](#-installation) • [Usage](#-usage) • [Agents](#-available-agents) • [Development](#-development)

</div>

---

## Overview

Flynn is a **Mastra-powered** multi-agent system that extends Claude Code with specialized AI agents. One command routes your request to the right expert agent.

```
/flynn <your task>
```

<br>

## Features

| | Feature | Description |
|:--:|---------|-------------|
| 🎯 | **Smart Routing** | Automatically routes tasks to specialized agents |
| 🔧 | **8 Expert Agents** | Installer, Diagnostic, Scaffolder, Coder, Refactor, Release, Data, Healer |
| 🔄 | **Self-Healing** | Automatic failure recovery with intelligent retry |
| 🧠 | **Persistent Memory** | Context continuity across sessions via LibSQL |
| 🔒 | **Security First** | Policy-based permissions and XDG-compliant paths |
| 🐍 | **Python Integration** | Optional pandas & ML tools for data tasks |

<br>

## Installation

### Quick Install

```bash
curl -fsSL https://raw.githubusercontent.com/reze83/Flynn-Project/main/install.sh | bash
```

<details>
<summary><b>Manual Installation</b></summary>

```bash
git clone https://github.com/reze83/Flynn-Project.git
cd Flynn-Project
pnpm install
pnpm build
```

</details>

### Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | >= 20 | Required |
| pnpm | >= 9 | Via corepack |
| Anthropic API Key | - | Set `ANTHROPIC_API_KEY` |
| Python | >= 3.11 | Optional (data/ML) |
| uv | latest | Optional (Python pkg mgr) |

<br>

## Usage

In Claude Code, use the slash command:

```
/flynn <task description>
```

### Examples

```bash
# Installation & Setup
/flynn install dependencies for a React project
/flynn setup TypeScript with strict mode

# Debugging & Diagnostics
/flynn diagnose why my tests are failing
/flynn debug this authentication error

# Code Generation
/flynn create a new Express API with TypeScript
/flynn implement user authentication with JWT

# Code Quality
/flynn refactor this function for better readability
/flynn optimize database queries in user service

# Release Management
/flynn prepare release v2.0.0
/flynn generate changelog from commits

# Data Analysis
/flynn analyze sales.csv and show trends
/flynn run sentiment analysis on reviews
```

<br>

## Available Agents

```
                    ┌─────────────────┐
                    │   Orchestrator  │
                    │    (Router)     │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   Installer   │  │  Diagnostic   │  │  Scaffolder   │
│   setup, dep  │  │  debug, fix   │  │  create, new  │
└───────────────┘  └───────────────┘  └───────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│     Coder     │  │   Refactor    │  │    Release    │
│  implement    │  │   improve     │  │   publish     │
└───────────────┘  └───────────────┘  └───────────────┘
        │                    │
        ▼                    ▼
┌───────────────┐  ┌───────────────┐
│     Data      │  │    Healer     │
│   analyze     │  │  auto-recover │
└───────────────┘  └───────────────┘
```

| Agent | Triggers | Capabilities |
|:------|:---------|:-------------|
| **Installer** | `install` `setup` `bootstrap` | Dependency management, environment setup |
| **Diagnostic** | `diagnose` `debug` `fix` `error` | Error analysis, troubleshooting |
| **Scaffolder** | `create` `new` `scaffold` `init` | Project generation, boilerplate |
| **Coder** | `implement` `code` `write` `add` | Feature development, code writing |
| **Refactor** | `refactor` `improve` `optimize` | Code quality, performance |
| **Release** | `release` `publish` `version` | Versioning, changelog, publishing |
| **Data** | `data` `csv` `pandas` `ml` | Data analysis, ML inference |
| **Healer** | *(automatic)* | Failure recovery, retry logic |

<br>

## Configuration

Flynn uses **XDG-compliant** paths:

```
~/.config/flynn/         # Configuration
~/.local/share/flynn/    # Data (memory, state)
~/.cache/flynn/          # Cache
```

### Security Policy

Edit `config/flynn.policy.yaml`:

```yaml
permissions:
  shell:
    allow: ["git *", "pnpm *", "npm *"]
    deny: ["rm -rf /", "sudo *"]
  paths:
    writable: ["${PROJECT_ROOT}/**"]
    readonly: ["/etc", "/usr"]
```

### Agent Routing

Edit `config/capabilities.yaml`:

```yaml
agents:
  installer:
    triggers: ["install", "setup", "bootstrap"]
    tools: ["shell", "file-ops", "git-ops"]
    priority: high
```

<br>

## Development

```bash
pnpm install      # Install dependencies
pnpm build        # Build all packages
pnpm test         # Run tests (169 unit tests)
pnpm lint         # Lint & format check
pnpm typecheck    # Type check
pnpm dev          # Watch mode
```

### Project Structure

```
Flynn-Project/
├── packages/
│   ├── core/           # @flynn/core - Shared utilities
│   ├── bootstrap/      # @flynn/bootstrap - Self-installation
│   ├── agents/         # @flynn/agents - Mastra agents
│   ├── tools/          # @flynn/tools - Mastra tools
│   └── python/         # flynn-python - Data/ML tools
├── apps/
│   └── server/         # MCP Server entry point
├── config/
│   ├── flynn.policy.yaml
│   └── capabilities.yaml
└── .claude/
    └── commands/
        └── flynn.md    # Slash command
```

### Tech Stack

| Technology | Purpose |
|------------|---------|
| [Mastra](https://mastra.ai) | Agent Framework |
| [MCP](https://modelcontextprotocol.io) | Model Context Protocol |
| [LibSQL](https://turso.tech/libsql) | Memory Storage |
| [Biome](https://biomejs.dev) | Linting & Formatting |
| [Vitest](https://vitest.dev) | Testing |

<br>

## Architecture

```
┌────────────────────────────────────────────────────┐
│                   Claude Code                       │
│                        │                            │
│                  /flynn "task"                      │
│                        │                            │
│                   MCP Protocol                      │
│                        ▼                            │
│  ┌──────────────────────────────────────────────┐  │
│  │              Flynn MCP Server                 │  │
│  │  ┌────────────────────────────────────────┐  │  │
│  │  │         Orchestrator Agent             │  │  │
│  │  │      (Routing + Coordination)          │  │  │
│  │  └───────────────────┬────────────────────┘  │  │
│  │                      │                       │  │
│  │         ┌────────────┼────────────┐          │  │
│  │         ▼            ▼            ▼          │  │
│  │    ┌────────┐  ┌──────────┐  ┌────────┐     │  │
│  │    │ Agent  │  │  Agent   │  │ Agent  │     │  │
│  │    └────────┘  └──────────┘  └────────┘     │  │
│  │                      │                       │  │
│  │         ┌────────────┴────────────┐          │  │
│  │         │         Tools           │          │  │
│  │         │  shell │ git │ file-ops │          │  │
│  │         └─────────────────────────┘          │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

<br>

## License

MIT © 2024

---

<div align="center">

**Built with [Mastra](https://mastra.ai) and [Claude](https://anthropic.com)**

</div>

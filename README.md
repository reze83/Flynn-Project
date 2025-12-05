<p align="center">
  <img src="https://img.shields.io/badge/F-L-Y-N-N-black?style=for-the-badge&labelColor=black" alt="Flynn" />
</p>

<h1 align="center">
  <br>
  <img width="400" src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12&height=120&section=header&text=Flynn&fontSize=70&fontColor=fff&animation=fadeIn&fontAlignY=35" alt="Flynn Header"/>
  <br>
</h1>

<p align="center">
  <strong>🤖 Autonomous AI Agent Orchestrator for Claude Code</strong>
</p>

<p align="center">
  <a href="https://github.com/reze83/Flynn-Project/actions/workflows/ci.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/reze83/Flynn-Project/ci.yml?branch=main&style=flat-square&logo=github&label=CI" alt="CI Status"/>
  </a>
  <img src="https://img.shields.io/badge/node-%3E%3D20-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node"/>
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Mastra-AI_Framework-FF6B6B?style=flat-square" alt="Mastra"/>
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License"/>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#-agents">Agents</a> •
  <a href="#%EF%B8%8F-configuration">Config</a> •
  <a href="#-development">Development</a>
</p>

<br>

<div align="center">
  <pre>
  ╭──────────────────────────────────────────────╮
  │                                              │
  │   <b>/flynn</b> install react with typescript       │
  │                                              │
  │   ✓ Routing to <b>Installer Agent</b>...           │
  │   ✓ Analyzing project requirements           │
  │   ✓ Installing dependencies                  │
  │   ✓ Configuring TypeScript                   │
  │                                              │
  │   Done in 12.4s                              │
  │                                              │
  ╰──────────────────────────────────────────────╯
  </pre>
</div>

<br>

## 💡 What is Flynn?

Flynn is a **multi-agent AI system** built on the [Mastra Framework](https://mastra.ai) that extends Claude Code. Instead of one general-purpose AI, Flynn routes your requests to **specialized expert agents** - each optimized for specific development tasks.

```
You: /flynn debug why my API returns 500 errors

Flynn: 🔍 Routing to Diagnostic Agent...
       → Analyzing error logs
       → Found: Database connection timeout in UserService
       → Suggested fix: Increase pool size in config/database.ts
```

<br>

## 🚀 Quick Start

```bash
curl -fsSL https://raw.githubusercontent.com/reze83/Flynn-Project/main/install.sh | bash
```

<details>
<summary>📦 <b>Manual Installation</b></summary>
<br>

```bash
# Clone & install
git clone https://github.com/reze83/Flynn-Project.git
cd Flynn-Project
pnpm install && pnpm build

# Set your API key
export ANTHROPIC_API_KEY="sk-..."
```

</details>

<details>
<summary>📋 <b>Prerequisites</b></summary>
<br>

| | Requirement | Version |
|:--:|-------------|---------|
| 📗 | Node.js | `>= 20` |
| 📦 | pnpm | `>= 9` |
| 🔑 | Anthropic API Key | required |
| 🐍 | Python | `>= 3.11` *(optional)* |

</details>

<br>

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎯 Smart Routing
Automatically analyzes your request and routes to the best-suited specialized agent.

### 🔄 Self-Healing
Failed operations trigger the Healer Agent for automatic recovery with intelligent retry strategies.

### 🧠 Persistent Memory
LibSQL-backed memory maintains context across sessions for continuous assistance.

</td>
<td width="50%">

### 🔒 Security First
Policy-based permissions control shell commands, file access, and network operations.

### 🐍 Python Integration
Optional pandas & transformers tools for data analysis and ML inference tasks.

### ⚡ 8 Expert Agents
Specialized agents for install, debug, scaffold, code, refactor, release, data, and healing.

</td>
</tr>
</table>

<br>

## 🤖 Agents

<table>
<tr>
<td align="center" width="12.5%">
<br>
<img width="40" src="https://api.iconify.design/mdi:package-variant-closed.svg?color=%2310b981" alt="Installer"/>
<br><br>
<b>Installer</b>
<br>
<sub>setup, deps</sub>
<br><br>
</td>
<td align="center" width="12.5%">
<br>
<img width="40" src="https://api.iconify.design/mdi:bug-outline.svg?color=%23f59e0b" alt="Diagnostic"/>
<br><br>
<b>Diagnostic</b>
<br>
<sub>debug, fix</sub>
<br><br>
</td>
<td align="center" width="12.5%">
<br>
<img width="40" src="https://api.iconify.design/mdi:folder-plus-outline.svg?color=%233b82f6" alt="Scaffolder"/>
<br><br>
<b>Scaffolder</b>
<br>
<sub>create, new</sub>
<br><br>
</td>
<td align="center" width="12.5%">
<br>
<img width="40" src="https://api.iconify.design/mdi:code-braces.svg?color=%238b5cf6" alt="Coder"/>
<br><br>
<b>Coder</b>
<br>
<sub>implement</sub>
<br><br>
</td>
<td align="center" width="12.5%">
<br>
<img width="40" src="https://api.iconify.design/mdi:auto-fix.svg?color=%23ec4899" alt="Refactor"/>
<br><br>
<b>Refactor</b>
<br>
<sub>improve</sub>
<br><br>
</td>
<td align="center" width="12.5%">
<br>
<img width="40" src="https://api.iconify.design/mdi:rocket-launch-outline.svg?color=%23ef4444" alt="Release"/>
<br><br>
<b>Release</b>
<br>
<sub>publish</sub>
<br><br>
</td>
<td align="center" width="12.5%">
<br>
<img width="40" src="https://api.iconify.design/mdi:chart-line.svg?color=%2306b6d4" alt="Data"/>
<br><br>
<b>Data</b>
<br>
<sub>analyze</sub>
<br><br>
</td>
<td align="center" width="12.5%">
<br>
<img width="40" src="https://api.iconify.design/mdi:heart-pulse.svg?color=%2322c55e" alt="Healer"/>
<br><br>
<b>Healer</b>
<br>
<sub>recover</sub>
<br><br>
</td>
</tr>
</table>

<br>

### 📝 Example Commands

```bash
# 📦 Installation & Setup
/flynn install dependencies for a Next.js project
/flynn setup ESLint and Prettier

# 🐛 Debugging
/flynn diagnose why my tests are failing
/flynn debug the authentication flow

# 🏗️ Scaffolding
/flynn create a REST API with Express and TypeScript
/flynn scaffold a React component library

# 💻 Coding
/flynn implement JWT authentication
/flynn add a dark mode toggle

# ✨ Refactoring
/flynn refactor this function to be more readable
/flynn optimize the database queries

# 🚀 Release
/flynn prepare release v2.0.0
/flynn generate changelog

# 📊 Data
/flynn analyze sales.csv and identify trends
/flynn run sentiment analysis on feedback.json
```

<br>

## ⚙️ Configuration

<table>
<tr>
<td width="50%">

### 📁 XDG Paths

```
~/.config/flynn/      # Config
~/.local/share/flynn/ # Data
~/.cache/flynn/       # Cache
```

</td>
<td width="50%">

### 🔐 Security Policy

```yaml
# config/flynn.policy.yaml
permissions:
  shell:
    allow: ["git *", "pnpm *"]
    deny: ["rm -rf /", "sudo *"]
```

</td>
</tr>
</table>

<br>

## 🛠️ Development

```bash
pnpm install      # Install deps
pnpm build        # Build packages
pnpm test         # Run 169 tests
pnpm lint         # Check code
pnpm dev          # Watch mode
```

<details>
<summary>📂 <b>Project Structure</b></summary>
<br>

```
Flynn-Project/
├── 📦 packages/
│   ├── core/        # Shared utilities
│   ├── bootstrap/   # Self-installation
│   ├── agents/      # Mastra agents
│   ├── tools/       # Mastra tools
│   └── python/      # Data/ML tools
├── 🚀 apps/
│   └── server/      # MCP Server
├── ⚙️ config/
│   ├── flynn.policy.yaml
│   └── capabilities.yaml
└── 🤖 .claude/
    └── commands/
        └── flynn.md
```

</details>

<details>
<summary>🧰 <b>Tech Stack</b></summary>
<br>

| Technology | Purpose |
|:-----------|:--------|
| [Mastra](https://mastra.ai) | AI Agent Framework |
| [MCP](https://modelcontextprotocol.io) | Model Context Protocol |
| [LibSQL](https://turso.tech/libsql) | Memory Storage |
| [Biome](https://biomejs.dev) | Linting & Formatting |
| [Vitest](https://vitest.dev) | Testing Framework |

</details>

<br>

## 🏗️ Architecture

```
                         ┌─────────────────────────────────┐
                         │         Claude Code             │
                         └───────────────┬─────────────────┘
                                         │
                                    /flynn "..."
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          Flynn MCP Server                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      🎯 Orchestrator                              │  │
│  │                   Intent Analysis & Routing                       │  │
│  └──────────────────────────────┬───────────────────────────────────┘  │
│                                 │                                       │
│         ┌───────────┬───────────┼───────────┬───────────┐              │
│         ▼           ▼           ▼           ▼           ▼              │
│    ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│    │Installer│ │Diagnose │ │Scaffold │ │  Coder  │ │   ...   │        │
│    └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
│                                 │                                       │
│  ┌──────────────────────────────┴───────────────────────────────────┐  │
│  │                         🔧 Tools                                  │  │
│  │              shell • git • file-ops • project-analysis            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

<br>

---

<p align="center">
  <sub>Built with ❤️ using <a href="https://mastra.ai">Mastra</a> and <a href="https://anthropic.com">Claude</a></sub>
</p>

<p align="center">
  <a href="LICENSE">MIT License</a> • © 2024
</p>

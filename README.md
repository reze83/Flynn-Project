<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:667eea,100:764ba2&height=200&section=header&text=Flynn&fontSize=80&fontColor=fff&animation=fadeIn&fontAlignY=35&desc=AI%20Agent%20Orchestrator&descSize=20&descAlignY=55" width="100%"/>
</div>

<p align="center">
  <a href="https://github.com/reze83/Flynn-Project/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/reze83/Flynn-Project/ci.yml?style=for-the-badge&logo=github&label=CI&labelColor=1a1a2e&color=16a34a" alt="CI"/></a>
  <img src="https://img.shields.io/badge/Node.js-≥20-339933?style=for-the-badge&logo=node.js&logoColor=white&labelColor=1a1a2e" alt="Node"/>
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white&labelColor=1a1a2e" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge&labelColor=1a1a2e" alt="License"/>
</p>

<p align="center">
  <b>Multi-Agent AI system that extends Claude Code with specialized expert agents</b>
</p>

<p align="center">
  <a href="#installation">Installation</a> ·
  <a href="#usage">Usage</a> ·
  <a href="#agents">Agents</a> ·
  <a href="#configuration">Config</a> ·
  <a href="#development">Development</a>
</p>

<br/>

## About

Flynn routes your development tasks to specialized AI agents - each optimized for specific domains like debugging, scaffolding, coding, or releasing. Built on the [Mastra Framework](https://mastra.ai) with persistent memory and self-healing capabilities.

```bash
/flynn diagnose why my API returns 500 errors
```

<br/>

## Installation

```bash
curl -fsSL https://raw.githubusercontent.com/reze83/Flynn-Project/main/install.sh | bash
```

<details>
<summary><kbd>Manual Installation</kbd></summary>
<br/>

```bash
git clone https://github.com/reze83/Flynn-Project.git
cd Flynn-Project
pnpm install && pnpm build
export ANTHROPIC_API_KEY="sk-..."
```

</details>

<br/>

## Usage

```bash
/flynn <task description>
```

| Category | Example |
|:---------|:--------|
| **Setup** | `/flynn install dependencies for Next.js` |
| **Debug** | `/flynn diagnose failing tests` |
| **Create** | `/flynn scaffold a REST API with Express` |
| **Code** | `/flynn implement JWT authentication` |
| **Improve** | `/flynn refactor for readability` |
| **Release** | `/flynn prepare release v2.0.0` |
| **Data** | `/flynn analyze sales.csv` |

<br/>

## Agents

| Agent | Triggers | Description |
|:------|:---------|:------------|
| **Installer** | `install` `setup` `bootstrap` | Dependency management |
| **Diagnostic** | `diagnose` `debug` `fix` `error` | Error analysis & troubleshooting |
| **Scaffolder** | `create` `new` `scaffold` `init` | Project generation |
| **Coder** | `implement` `code` `write` `add` | Feature development |
| **Refactor** | `refactor` `improve` `optimize` | Code quality |
| **Release** | `release` `publish` `version` | Version management |
| **Data** | `data` `csv` `pandas` `ml` | Data analysis & ML |
| **Healer** | *(automatic)* | Failure recovery |

<br/>

## Configuration

Flynn uses XDG-compliant paths:

| Path | Purpose |
|:-----|:--------|
| `~/.config/flynn/` | Configuration |
| `~/.local/share/flynn/` | Data & memory |
| `~/.cache/flynn/` | Cache |

<details>
<summary><kbd>Security Policy</kbd></summary>
<br/>

```yaml
# config/flynn.policy.yaml
permissions:
  shell:
    allow: ["git *", "pnpm *", "npm *"]
    deny: ["rm -rf /", "sudo *"]
  paths:
    writable: ["${PROJECT_ROOT}/**"]
```

</details>

<details>
<summary><kbd>Agent Routing</kbd></summary>
<br/>

```yaml
# config/capabilities.yaml
agents:
  installer:
    triggers: ["install", "setup", "bootstrap"]
    tools: ["shell", "file-ops", "git-ops"]
    priority: high
```

</details>

<br/>

## Development

```bash
pnpm install      # Dependencies
pnpm build        # Build
pnpm test         # 169 tests
pnpm lint         # Lint check
pnpm dev          # Watch mode
```

<details>
<summary><kbd>Project Structure</kbd></summary>
<br/>

```
Flynn-Project/
├── packages/
│   ├── core/           # Shared utilities
│   ├── bootstrap/      # Self-installation
│   ├── agents/         # Mastra agents
│   ├── tools/          # Mastra tools
│   └── python/         # Data/ML tools
├── apps/
│   └── server/         # MCP Server
└── config/
    ├── flynn.policy.yaml
    └── capabilities.yaml
```

</details>

<br/>

## Tech Stack

<p align="left">
  <a href="https://mastra.ai"><img src="https://img.shields.io/badge/Mastra-Agent_Framework-FF6B6B?style=for-the-badge&labelColor=1a1a2e" alt="Mastra"/></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-Protocol-8B5CF6?style=for-the-badge&labelColor=1a1a2e" alt="MCP"/></a>
  <a href="https://turso.tech/libsql"><img src="https://img.shields.io/badge/LibSQL-Storage-06B6D4?style=for-the-badge&labelColor=1a1a2e" alt="LibSQL"/></a>
  <a href="https://biomejs.dev"><img src="https://img.shields.io/badge/Biome-Linting-60A5FA?style=for-the-badge&labelColor=1a1a2e" alt="Biome"/></a>
  <a href="https://vitest.dev"><img src="https://img.shields.io/badge/Vitest-Testing-729B1B?style=for-the-badge&labelColor=1a1a2e" alt="Vitest"/></a>
</p>

<br/>

## Prerequisites

| Requirement | Version | Required |
|:------------|:--------|:--------:|
| Node.js | `≥ 20` | ✓ |
| pnpm | `≥ 9` | ✓ |
| Anthropic API Key | - | ✓ |
| Python | `≥ 3.11` | ○ |
| uv | latest | ○ |

<br/>

---

<p align="center">
  <sub>Built with <a href="https://mastra.ai">Mastra</a> · Powered by <a href="https://anthropic.com">Claude</a></sub>
</p>

<p align="center">
  <a href="LICENSE">MIT</a> · © 2024
</p>

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:667eea,100:764ba2&height=100&section=footer" width="100%"/>
</div>

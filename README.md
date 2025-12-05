<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:667eea,100:764ba2&height=220&section=header&text=Flynn&fontSize=80&fontColor=fff&animation=fadeIn&fontAlignY=28&desc=AI%20Agent%20Orchestrator&descSize=18&descAlignY=50" width="100%"/>
</div>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-≥20-339933?style=for-the-badge&logo=node.js&logoColor=white&labelColor=1a1a2e" alt="Node"/>
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white&labelColor=1a1a2e" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Mastra-Framework-FF6B6B?style=for-the-badge&labelColor=1a1a2e" alt="Mastra"/>
  <img src="https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge&labelColor=1a1a2e" alt="License"/>
</p>

<p align="center">
  <b>Multi-Agent AI system that extends Claude Code with specialized expert agents</b>
</p>

<p align="center">
  <a href="#-installation">Installation</a> ·
  <a href="#-how-it-works">How it Works</a> ·
  <a href="#-agents">Agents</a> ·
  <a href="#%EF%B8%8F-configuration">Config</a>
</p>

<br/>

## Why Flynn?

Instead of one general-purpose AI, Flynn routes your tasks to **specialized expert agents** - each optimized for specific domains. Built on [Mastra](https://mastra.ai) with persistent memory and self-healing.

<br/>

## 🚀 Installation

```bash
curl -fsSL https://raw.githubusercontent.com/reze83/Flynn-Project/main/install.sh | bash
```

<details>
<summary>Manual Installation</summary>

```bash
git clone https://github.com/reze83/Flynn-Project.git
cd Flynn-Project && pnpm install && pnpm build
export ANTHROPIC_API_KEY="sk-..."
```
</details>

<br/>

## 🔄 How it Works

```mermaid
flowchart LR
    subgraph Claude Code
        U["<b>/flynn</b> task"]
    end

    U --> O["🎯 Orchestrator"]

    O --> I["📦 Installer"]
    O --> D["🔍 Diagnostic"]
    O --> S["🏗️ Scaffolder"]
    O --> C["💻 Coder"]
    O --> R["✨ Refactor"]
    O --> RE["🚀 Release"]
    O --> DA["📊 Data"]

    H["💚 Healer"] -.->|auto-recovery| O

    style U fill:#667eea,stroke:#667eea,color:#fff
    style O fill:#764ba2,stroke:#764ba2,color:#fff
    style H fill:#22c55e,stroke:#22c55e,color:#fff
```

<br/>

## 🤖 Agents

| Agent | Triggers | What it does |
|:------|:---------|:-------------|
| **📦 Installer** | `install` `setup` `bootstrap` | Dependencies & environment setup |
| **🔍 Diagnostic** | `diagnose` `debug` `fix` `error` | Error analysis & troubleshooting |
| **🏗️ Scaffolder** | `create` `new` `scaffold` `init` | Project & component generation |
| **💻 Coder** | `implement` `code` `write` `add` | Feature development |
| **✨ Refactor** | `refactor` `improve` `optimize` | Code quality improvements |
| **🚀 Release** | `release` `publish` `version` | Version & release management |
| **📊 Data** | `data` `csv` `pandas` `ml` | Data analysis & ML inference |
| **💚 Healer** | *(automatic)* | Failure recovery & retry |

<br/>

## 📝 Usage Examples

```bash
/flynn install dependencies for Next.js      # → Installer Agent
/flynn diagnose why tests are failing        # → Diagnostic Agent
/flynn create a REST API with Express        # → Scaffolder Agent
/flynn implement JWT authentication          # → Coder Agent
/flynn refactor for better readability       # → Refactor Agent
/flynn prepare release v2.0.0                # → Release Agent
/flynn analyze sales.csv                     # → Data Agent
```

<br/>

## ⚙️ Configuration

<table>
<tr>
<td width="50%">

**XDG Paths**
```
~/.config/flynn/        # Config
~/.local/share/flynn/   # Data
~/.cache/flynn/         # Cache
```

</td>
<td width="50%">

**Security Policy**
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

<br/>

## 🛠️ Development

```bash
pnpm install    # Install dependencies
pnpm build      # Build all packages
pnpm test       # Run 169 tests
pnpm lint       # Check code quality
```

<details>
<summary>Project Structure</summary>

```
Flynn-Project/
├── packages/
│   ├── core/        # Shared utilities
│   ├── bootstrap/   # Self-installation
│   ├── agents/      # Mastra agents
│   ├── tools/       # Mastra tools
│   └── python/      # Data/ML tools
├── apps/server/     # MCP Server
└── config/          # Policy & capabilities
```
</details>

<details>
<summary>Tech Stack</summary>

| | Technology | Purpose |
|:--:|:-----------|:--------|
| 🤖 | [Mastra](https://mastra.ai) | Agent Framework |
| 🔌 | [MCP](https://modelcontextprotocol.io) | Model Context Protocol |
| 💾 | [LibSQL](https://turso.tech/libsql) | Memory Storage |
| 🧹 | [Biome](https://biomejs.dev) | Linting & Formatting |
| 🧪 | [Vitest](https://vitest.dev) | Testing |

</details>

<details>
<summary>Prerequisites</summary>

| Requirement | Version | Notes |
|:------------|:--------|:------|
| Node.js | `≥ 20` | Required |
| pnpm | `≥ 9` | Required |
| Claude Code | latest | With Pro/Max plan or API key |
| Python | `≥ 3.11` | Optional, recommended |
| uv | latest | For Python dependencies |

</details>

<br/>

---

<p align="center">
  <sub>Built with <a href="https://mastra.ai">Mastra</a> · Powered by <a href="https://anthropic.com">Claude</a></sub>
</p>

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:667eea,100:764ba2&height=100&section=footer" width="100%"/>
</div>

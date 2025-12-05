# Flynn

Mastra-powered autonomous AI agent orchestrator for Claude Code.

Flynn provides a unified interface for development tasks through specialized AI agents that collaborate to handle installation, debugging, coding, refactoring, and more.

## Installation

### Quick Install (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/reze83/Flynn-Project/main/install.sh | bash
```

This will:
1. Check/install Node.js 20+
2. Check/install pnpm
3. Run the Flynn bootstrap package

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/reze83/Flynn-Project.git
cd Flynn-Project

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Link for local development
pnpm link --global
```

## Prerequisites

- **Node.js** 20+
- **pnpm** (installed via corepack)
- **Claude Code** CLI
- **Anthropic API Key** (set as `ANTHROPIC_API_KEY` environment variable)

Optional for data/ML features:
- **Python** 3.11+
- **uv** (Python package manager)

## Configuration

Flynn uses XDG-compliant paths:

```
~/.config/flynn/         # Configuration
~/.local/share/flynn/    # Data (memory, state)
~/.cache/flynn/          # Cache
```

### Security Policy

Edit `config/flynn.policy.yaml` to customize:
- Allowed shell commands
- Writable/readonly paths
- Network access rules

### Agent Capabilities

Edit `config/capabilities.yaml` to customize:
- Agent routing triggers
- Tool access per agent
- Priority levels

## Usage

In Claude Code, use the slash command:

```
/flynn <task description>
```

### Examples

```
/flynn install dependencies for a React project
/flynn diagnose why my tests are failing
/flynn create a new Express API with TypeScript
/flynn implement user authentication
/flynn refactor this function for better readability
/flynn prepare release v1.2.0
```

### Available Agents

| Agent | Triggers | Description |
|-------|----------|-------------|
| **installer** | install, setup, bootstrap | Dependency management |
| **diagnostic** | diagnose, debug, fix, error | Issue troubleshooting |
| **scaffolder** | create, new, scaffold, init | Project generation |
| **coder** | implement, code, write, add | Feature development |
| **refactor** | refactor, improve, optimize | Code improvement |
| **release** | release, publish, version | Release management |
| **data** | data, csv, pandas, ml | Data analysis |
| **healer** | *(automatic)* | Failure recovery |

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint and format
pnpm lint
pnpm format

# Type check
pnpm typecheck

# Development mode (watch)
pnpm dev
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
│   ├── flynn.policy.yaml   # Security policy
│   └── capabilities.yaml   # Agent routing
├── .claude/
│   └── commands/
│       └── flynn.md    # Slash command definition
└── docs/
    └── DESIGN.md       # Architecture documentation
```

## Architecture

Flynn uses the **Mastra AI Framework** with an Agent Network pattern:

- **Orchestrator Agent**: Routes tasks to specialized agents
- **Specialized Agents**: Handle specific task domains
- **Healer Agent**: Automatic failure recovery with retry logic
- **MCP Server**: Exposes tools to Claude Code

Memory is persisted using LibSQL for context continuity across sessions.

## License

MIT

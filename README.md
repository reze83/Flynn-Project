# Flynn-Project

Mastra-powered autonomous AI agent orchestrator for Claude Code.

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start server (for testing)
cd apps/server && pnpm start
```

## Structure

```
Flynn-Project/
├── packages/
│   ├── core/        # @flynn/core - Shared utilities
│   ├── bootstrap/   # @flynn/bootstrap - Self-installation
│   ├── agents/      # @flynn/agents - Mastra agents
│   ├── tools/       # @flynn/tools - Mastra tools
│   └── python/      # flynn-python - Data/ML tools
├── apps/
│   └── server/      # MCP Server entry point
├── config/
│   ├── flynn.policy.yaml
│   └── capabilities.yaml
└── docs/
    └── DESIGN.md
```

## Usage

```
/flynn <task description>
```

## License

MIT

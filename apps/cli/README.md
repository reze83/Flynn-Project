# Flynn CLI

Command-line interface for the Flynn Expert System.

## Installation

```bash
# From the project root
cd apps/cli
pnpm install
pnpm build

# Or install globally
npm install -g @flynn/cli
```

## Usage

```bash
# Show help
flynn --help

# View analytics
flynn analytics              # Summary
flynn analytics summary      # Summary
flynn analytics tools        # Tool usage stats
flynn analytics agents       # Agent usage stats
flynn analytics session      # Current session

# Run health check
flynn health
flynn health --verbose

# Manage plugins (coming soon)
flynn plugins list
flynn plugins install <name>
flynn plugins remove <name>
```

## Commands

### Analytics

View Flynn usage analytics and metrics.

```bash
# Summary of all analytics
flynn analytics

# Tool usage statistics (top 10)
flynn analytics tools
flynn analytics tools --limit 20

# Agent usage statistics
flynn analytics agents
flynn analytics agents --limit 5

# Current session details
flynn analytics session

# Use demo data (no API required)
flynn analytics --demo
```

### Health

Run system health checks.

```bash
# Basic health check
flynn health

# Verbose output with timing
flynn health --verbose
```

Checks include:
- Node.js version (requires v18+, recommends v20+)
- pnpm availability
- Git availability
- Python availability (optional)
- package.json presence
- node_modules presence
- tsconfig.json presence
- .claude configuration

### Plugins

Manage Flynn plugins (coming in Sprint 5B).

```bash
# List installed plugins
flynn plugins list

# Install a plugin
flynn plugins install @flynn-plugin/security

# Remove a plugin
flynn plugins remove @flynn-plugin/security

# Show plugin info
flynn plugins info @flynn-plugin/security
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FLYNN_API_URL` | Flynn API base URL | `http://localhost:3000/api` |

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Watch mode
pnpm dev

# Run tests
pnpm test

# Lint
pnpm lint
```

## Output Examples

### Analytics Summary

```
Flynn Analytics Summary
────────────────────────────────────────
  Total Sessions        42
  Total Tokens          1.2M
  Estimated Cost        $18.4500
  Avg Tokens/Session    29.4K
```

### Tool Statistics

```
Tool Usage Statistics

┌───────────────────┬───────┬──────────────┬──────────────┐
│ Tool              │ Count │ Avg Duration │ Success Rate │
├───────────────────┼───────┼──────────────┼──────────────┤
│ orchestrate       │ 156   │ 245ms        │ 98%          │
│ get-agent-context │ 134   │ 12ms         │ 100%         │
│ route-task        │ 98    │ 8ms          │ 99%          │
└───────────────────┴───────┴──────────────┴──────────────┘
```

### Health Check

```
Flynn Health Check

  ✔ Node.js                   v22.0.0
  ✔ pnpm                      v9.0.0
  ✔ Git                       v2.43.0
  ✔ Python                    v3.12.0
  ✔ package.json              Found
  ✔ node_modules              Found
  ✔ tsconfig.json             Found
  ✔ .claude config            Found

──────────────────────────────────────────────────
  Summary: 8 passed, 0 warnings, 0 failed

✔ All health checks passed!
```

## License

MIT

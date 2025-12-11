# Quick Start Guide

Get up and running with Flynn in 5 minutes! This guide walks you through installation, configuration, and your first agent usage.

## Prerequisites

Before starting, ensure you have:

- **Node.js 20+** ([Download](https://nodejs.org/))
- **pnpm 9+** (`npm install -g pnpm`)
- **Python 3.11+** (optional, for data/ML tools)
- **Git** ([Download](https://git-scm.com/))
- **Claude Code CLI** installed and configured

## Installation Methods

### Method 1: Automated Installer (Recommended)

The installer handles everything: dependencies, building, Claude Code configuration, and verification.

```bash
# Download installer
curl -fsSL https://raw.githubusercontent.com/reze83/Flynn-Project/main/install-flynn.sh -o install-flynn.sh

# Make executable and run
chmod +x install-flynn.sh
./install-flynn.sh
```

**What the installer does:**
- ✅ Installs Node.js (via fnm), pnpm, Python (via uv)
- ✅ Builds Flynn packages
- ✅ Configures Claude Code MCP servers
- ✅ Verifies installation
- ✅ Sets up Puppeteer dependencies (opt-out with `--without-puppeteer`)

**Installer Features:**
- **Error Recovery**: Automatic rollback on failures with detailed error reporting
- **Debug Mode**: Stack traces and detailed logging (`DEBUG=true ./install-flynn.sh`)
- **Signal Handling**: Graceful interrupt handling (Ctrl+C) with cleanup and rollback prompts
- **Dry Run**: Preview changes without modifying the system (`--dry-run`)

**Verification:**
```bash
./install-flynn.sh --verify --verify-detailed
```

**Troubleshooting:**
```bash
# Enable debug output for troubleshooting
DEBUG=true ./install-flynn.sh

# Rollback if needed
./install-flynn.sh --rollback

# View installation log
cat ~/.flynn/logs/install.log
```

### Method 2: Manual Installation

For developers who want full control:

```bash
# Clone repository
git clone https://github.com/reze83/Flynn-Project.git
cd Flynn-Project

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests (optional)
pnpm test
```

## Configuration

### Step 1: Configure MCP Server

Edit `~/.claude.json` (create if doesn't exist):

```json
{
  "mcpServers": {
    "flynn": {
      "type": "stdio",
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/Flynn-Project/apps/server/dist/server.js"]
    }
  }
}
```

⚠️ **Important**: Replace `/ABSOLUTE/PATH/TO` with your actual installation path!

### Step 2: Allow Flynn Tools

Edit `~/.claude/settings.json`:

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

### Step 3: Restart Claude Code

```bash
# Restart Claude Code to load Flynn MCP server
# Then verify connection:
/flynn list-workflows
```

## Your First Agent Usage

### Example 1: Simple Bug Fix

```bash
/flynn fix the authentication bug in src/auth.ts
```

**What happens:**
1. Flynn routes to **diagnostic agent**
2. Agent analyzes code and error logs
3. Agent proposes fix
4. Agent verifies solution works

### Example 2: Multi-Agent Workflow

```bash
/flynn build full stack user authentication
```

**Orchestrates 7 agents:**
1. api-designer → Design REST API
2. database-architect → Design schema
3. coder → Implement backend
4. frontend-architect → Design UI
5. test-architect → Write tests
6. security → Security review
7. devops-engineer → Deploy setup

### Example 3: Code Review

```bash
/flynn review the payment processing module
```

**Triggers parallel review:**
- reviewer (quality)
- security (vulnerabilities)
- performance (bottlenecks)

## Verification & Health Check

### Basic Verification

```bash
# Check if Flynn is loaded
/flynn system-info

# List available workflows
/flynn list-workflows

# List available agents
# (Check docs/AGENTS.md)
```

### Detailed Health Check

```bash
# Via installer
./install.sh --verify --verify-detailed

# Or check MCP tools directly
mcp__flynn__health-check({ "checks": ["all"] })
```

**Expected output:**
```
✓ Flynn MCP Server running
✓ 27 agents loaded
✓ 23 workflows available
✓ 18 MCP tools registered
✓ Configuration valid
```

## Common Commands

### Direct MCP Tool Usage

```bash
# Route task to appropriate agent
mcp__flynn__route-task({ "message": "optimize database queries" })

# Get agent context for specific task
mcp__flynn__get-agent-context({ "task": "security audit", "agent": "security" })

# Orchestrate multi-agent workflow
mcp__flynn__orchestrate({ "task": "migrate from React 17 to 18" })

# Check system health
mcp__flynn__health-check({ "checks": ["environment", "dependencies"] })
```

### Skills Usage

```bash
# List available skills
/flynn list-skills

# Get specific skill
mcp__flynn__get-skill({ "skillId": "typescript-advanced", "tier": 2 })
```

## Next Steps

Now that Flynn is running, explore these resources:

1. **[Architecture Overview](ARCHITECTURE.md)** - Understand how Flynn works
2. **[Agents Guide](AGENTS.md)** - Learn about all 27 agents
3. **[Workflows](WORKFLOWS.md)** - Explore 23 pre-built workflows
4. **[Tools Reference](TOOLS.md)** - Deep dive into MCP tools
5. **[Multi-Agent Examples](MULTI-AGENT-EXAMPLES.md)** - Advanced patterns

## Troubleshooting

### Flynn not loading in Claude Code

1. Verify `~/.claude.json` path is absolute
2. Check `apps/server/dist/server.js` exists (`pnpm build`)
3. Restart Claude Code completely
4. Check logs: `~/.flynn/logs/server.log`

### Permission errors

Add Flynn tools to `~/.claude/settings.json` permissions.allow array (see Step 2).

### Build failures

```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

### Still having issues?

Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for comprehensive solutions.

## Development Setup (Optional)

For contributors who want to develop Flynn:

### Run in Development Mode

```bash
# Watch mode (auto-rebuild on changes)
pnpm --filter @flynn/server dev

# Run tests in watch mode
pnpm test:watch

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

### Project Structure

```
Flynn-Project/
├── apps/
│   ├── server/         # MCP server (entry point)
│   ├── cli/            # CLI tools
│   └── dashboard/      # Analytics dashboard
├── packages/
│   ├── core/           # Core utilities
│   ├── tools/          # MCP tools implementation
│   ├── agents/         # Agent contexts
│   └── analytics/      # Usage tracking
├── docs/               # Documentation (you are here!)
└── scripts/            # Build & deployment scripts
```

### Contributing

Ready to contribute? See [CONTRIBUTING.md](../CONTRIBUTING.md) for:
- Code style guidelines
- Testing requirements
- Pull request process
- Development best practices

## Additional Resources

- **GitHub**: [reze83/Flynn-Project](https://github.com/reze83/Flynn-Project)
- **Documentation**: [docs/](.)
- **Issues**: [GitHub Issues](https://github.com/reze83/Flynn-Project/issues)
- **License**: [MIT](../LICENSE)

---

**Need help?** Join the discussion in [GitHub Issues](https://github.com/reze83/Flynn-Project/issues) or check [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

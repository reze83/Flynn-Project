# MCP Tool Configuration Guide

This guide explains how Flynn's MCP tool recommendation system works and how to configure it.

> **Related Documentation:**
> - [Agent Tools Integration](AGENT_TOOLS_INTEGRATION.md) - See which agents use which tools
> - [MCP Setup Guide](MCP-SETUP-GUIDE.md) - Configure Claude Code with Flynn
> - [MCP Server Reference](MCP-SERVER-REFERENCE.md) - Technical MCP server details

## Overview

Flynn Agents use **abstract tool names** (like `file-ops`, `code-analysis`) in their definitions. These are automatically mapped to **concrete MCP tool IDs** (like `mcp__serena__read_file`, `mcp__context7__get-library-docs`) at runtime.

This two-level system provides:
- **Flexibility**: Change MCP tool implementations without modifying agent definitions
- **Centralization**: All tool mappings in one place (`mcp-mappings.ts`)
- **Discoverability**: Dynamic tool discovery from external MCP servers

## Architecture

```
┌─────────────────┐
│  Agent Context  │ → tools: ["file-ops", "code-analysis"]
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  mcp-mappings   │ → Centralized mapping
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MCP Tool IDs   │ → ["mcp__serena__read_file", ...]
└─────────────────┘
```

### Components

1. **`AgentContext`** (`packages/tools/src/agents/types.ts`)
   - Defines agent properties including abstract `tools` array
   - Optional `recommendedMcpTools` for computed concrete tool IDs

2. **`mcp-mappings.ts`** (`packages/tools/src/agents/mcp-mappings.ts`)
   - Central mapping of agent IDs → MCP tool IDs
   - Two mapping systems:
     - **Direct mappings**: `AGENT_MCP_TOOL_MAPPINGS`
     - **Category mappings**: `AGENT_MCP_CATEGORIES`

3. **`mcp-registry.ts`** (`packages/tools/src/mcp-registry.ts`)
   - Dynamic discovery of external MCP tools
   - Categorization system for tool organization

4. **`orchestrate.ts`** & **`get-agent-context.ts`**
   - Runtime tool recommendation
   - Uses `getRecommendedMcpTools()` from mcp-mappings

## Configuration Methods

Flynn can discover external MCP tools from three sources (in order of precedence):

### 1. Environment Variable (Highest Priority)

```bash
export FLYNN_MCP_TOOLS="mcp__serena__read_file,mcp__context7__get-library-docs,mcp__exa__web_search_exa"
```

**Pros**: Easy for CI/CD, no file changes
**Cons**: Can become long, needs shell escaping

### 2. Flynn Config File

Create `~/.flynn/mcp-tools.json`:

```json
{
  "tools": [
    "mcp__serena__read_file",
    "mcp__serena__create_text_file",
    "mcp__serena__get_symbols_overview",
    "mcp__context7__get-library-docs",
    "mcp__exa__web_search_exa",
    "mcp__sequentialthinking-tools__sequentialthinking_tools"
  ]
}
```

**Pros**: Clean, version-controllable, easy to maintain
**Cons**: Requires file creation

### 3. Claude Settings (Lowest Priority)

Flynn automatically extracts MCP tool IDs from `~/.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "mcp__serena__read_file",
      "mcp__context7__get-library-docs",
      "other-permissions"
    ]
  }
}
```

**Pros**: No Flynn-specific configuration
**Cons**: Shared with other Claude settings

## Agent Tool Mappings

### Core Agents

| Agent | Abstract Tools | Key MCP Tools |
|-------|---------------|---------------|
| `coder` | file-ops, code-analysis, shell | serena (read/write/symbols), context7 (docs) |
| `diagnostic` | project-analysis, search, thinking | serena (search), exa (web search), sequential-thinking |
| `scaffolder` | file-ops, git, github-repo | serena (file ops), git tools, github repo tools |
| `installer` | shell, documentation | flynn shell, context7 docs |
| `refactor` | code-analysis, thinking | serena (symbols/rename), sequential-thinking |
| `release` | git-ops, github-pr | git (tag/push), github PR tools |
| `healer` | search, thinking | flynn heal-error, exa search |

### Specialized Agents

| Agent | Abstract Tools | Key MCP Tools |
|-------|---------------|---------------|
| `security` | code-analysis, search, research | serena (pattern search), exa (CVE research) |
| `reviewer` | code-analysis, git | serena (symbols), git diff, context7 |
| `performance` | code-analysis, thinking | serena (analysis), sequential-thinking |
| `qa-tester` | puppeteer, search | puppeteer (navigate/screenshot/click) |

### Complete Mapping Reference

See `packages/tools/src/agents/mcp-mappings.ts` for the complete, up-to-date mapping of all 30+ agents.

## Adding New Agent Tool Mappings

### Step 1: Define Agent in its Category File

Edit the appropriate file (e.g., `packages/tools/src/agents/core-agents.ts`):

```typescript
export const myNewAgent: AgentContext = {
  id: "my-new-agent",
  name: "Flynn My New Agent",
  description: "Does something special",
  tools: ["file-ops", "custom-tool"], // Abstract tool names
  // ... other properties
};
```

### Step 2: Add MCP Tool Mapping

Edit `packages/tools/src/agents/mcp-mappings.ts`:

```typescript
export const AGENT_MCP_TOOL_MAPPINGS: Record<string, string[]> = {
  // ... existing mappings
  "my-new-agent": [
    // File Operations
    "mcp__flynn__file-ops",
    "mcp__serena__read_file",
    // Custom Tools
    "mcp__my_custom_server__my_tool",
  ],
};
```

### Step 3: Add Category Mapping (Optional)

For dynamic tool discovery:

```typescript
export const AGENT_MCP_CATEGORIES: Record<string, McpToolCategory[]> = {
  // ... existing mappings
  "my-new-agent": ["file-ops", "custom-category"],
};
```

### Step 4: Export from Agent Category

In the category file:

```typescript
export const MY_CATEGORY_AGENTS: Record<string, AgentContext> = {
  myNewAgent,
  // ... other agents
};
```

### Step 5: Test

```typescript
// packages/tools/__tests__/mcp-integration.test.ts
it("should have tools for my-new-agent", () => {
  const tools = getRecommendedMcpTools("my-new-agent");
  expect(tools.length).toBeGreaterThan(0);
  expect(tools).toContain("mcp__my_custom_server__my_tool");
});
```

## MCP Tool Categories

Flynn uses these standard categories for organizing tools:

| Category | Description | Example Tools |
|----------|-------------|---------------|
| `code-analysis` | Symbol navigation, code understanding | serena symbols, find_symbol |
| `code-editing` | Code modification | serena replace_symbol_body, rename |
| `documentation` | Library docs, API reference | context7, exa code context |
| `search` | Web search, code search | exa web_search |
| `research` | Deep research, analysis | exa deep_researcher |
| `thinking` | Structured reasoning | sequential-thinking |
| `file-ops` | File operations | serena/flynn file ops |
| `shell` | Command execution | flynn shell |
| `git` | Version control | git tools |
| `github-repo` | GitHub repository ops | github create_repo |
| `github-pr` | GitHub PRs | github create_pr |
| `puppeteer` | Browser automation | puppeteer navigate |
| `docker` | Container management | docker tools |
| `memory` | Persistent storage | mem0 tools |

## Runtime Behavior

### 1. Agent Orchestration

When `orchestrate` tool is called:

```typescript
// packages/tools/src/orchestrate.ts
function buildAgentSteps(agentSequence: string[]) {
  return agentSequence.map((role) => ({
    // ...
    recommendedMcpTools: getRecommendedMcpTools(role), // ← Uses central mapping
  }));
}
```

### 2. Agent Context Retrieval

When `get-agent-context` tool is called:

```typescript
// packages/tools/src/get-agent-context.ts
function getExternalToolRecommendations(agentId: string) {
  // 1. Get direct tools from mapping
  const directTools = getRecommendedMcpTools(agentId);

  // 2. Get category-based tools from registry
  const categories = AGENT_MCP_CATEGORIES[agentId];
  const categoryTools = mcpRegistry.getToolsByCategory(categories);

  // 3. Combine and deduplicate
  return [...new Set([...directTools, ...categoryTools])];
}
```

## Troubleshooting

### Problem: "No external MCP tools configured"

**Symptom**: Log message on server startup

**Solution**: Set one of the configuration methods:

```bash
# Option 1: Environment variable
export FLYNN_MCP_TOOLS="mcp__serena__read_file,mcp__context7__get-library-docs"

# Option 2: Create config file
mkdir -p ~/.flynn
cat > ~/.flynn/mcp-tools.json << EOF
{
  "tools": ["mcp__serena__read_file"]
}
EOF
```

### Problem: Agent missing tool recommendations

**Symptom**: `getRecommendedMcpTools("agent-id")` returns `[]`

**Solution**:

1. Check if agent exists in `AGENT_MCP_TOOL_MAPPINGS`
2. Add mapping in `mcp-mappings.ts` if missing
3. Verify agent ID matches exactly

### Problem: Duplicate tool recommendations

**Symptom**: Same tool appears multiple times in recommendations

**Solution**: This shouldn't happen (tools are deduplicated). If it does:

1. Check for typos in tool IDs
2. Verify `getRecommendedMcpTools()` uses `new Set()`

### Problem: Tests failing

**Symptom**: `mcp-integration.test.ts` failures

**Solution**:

```bash
# Run tests
cd packages/tools
pnpm test mcp-integration

# Check for:
# - Missing agent mappings
# - Orphaned tool mappings
# - Duplicate tool IDs
```

## Best Practices

### 1. Prefer Direct Mappings

Use `AGENT_MCP_TOOL_MAPPINGS` for explicit tool recommendations:

```typescript
"my-agent": [
  "mcp__specific__tool_id",  // ✅ Explicit
]
```

Avoid relying only on categories for critical tools.

### 2. Keep Mappings DRY

Extract common tool sets:

```typescript
const COMMON_FILE_OPS = [
  "mcp__flynn__file-ops",
  "mcp__serena__read_file",
  "mcp__serena__create_text_file",
];

export const AGENT_MCP_TOOL_MAPPINGS = {
  agent1: [...COMMON_FILE_OPS, "mcp__agent1__specific"],
  agent2: [...COMMON_FILE_OPS, "mcp__agent2__specific"],
};
```

### 3. Document New Tools

When adding new MCP tools:

1. Add to appropriate category in `mcp-registry.ts`
2. Update this documentation
3. Add tests in `mcp-integration.test.ts`

### 4. Version Control

- **DO** commit `mcp-mappings.ts` changes
- **DO** commit Flynn config examples
- **DON'T** commit user-specific `~/.flynn/mcp-tools.json`

## API Reference

### `getRecommendedMcpTools(agentId: string): string[]`

Returns deduplicated array of MCP tool IDs for an agent.

```typescript
const tools = getRecommendedMcpTools("coder");
// ["mcp__flynn__file-ops", "mcp__serena__read_file", ...]
```

### `getAgentMcpCategories(agentId: string): McpToolCategory[]`

Returns MCP tool categories for an agent.

```typescript
const categories = getAgentMcpCategories("coder");
// ["code-analysis", "code-editing", "documentation"]
```

### `hasRecommendedMcpTools(agentId: string): boolean`

Checks if an agent has tool recommendations.

```typescript
if (hasRecommendedMcpTools("my-agent")) {
  // Agent has tools configured
}
```

### `getAgentsWithMcpTools(): string[]`

Returns all agent IDs that have MCP tool mappings.

```typescript
const agents = getAgentsWithMcpTools();
// ["coder", "diagnostic", "reviewer", ...]
```

## Migration Guide

### Upgrading from Pre-Centralized System

If you have custom agents using the old system:

**Before:**
```typescript
// In orchestrate.ts
recommendedMcpTools: mapToolsToMcpIds(ctx.tools)
```

**After:**
```typescript
// In mcp-mappings.ts
export const AGENT_MCP_TOOL_MAPPINGS = {
  "my-agent": ["mcp__specific__tool"],
};

// In orchestrate.ts
recommendedMcpTools: getRecommendedMcpTools(role)
```

### Deprecation Notice

`mapToolsToMcpIds()` in `orchestrate.ts` is deprecated. Use `getRecommendedMcpTools()` instead.

## Further Reading

- [MCP Server Reference](./MCP-SERVER-REFERENCE.md) - External MCP servers
- [Agents Documentation](./AGENTS.md) - Agent system overview
- [Tools Documentation](./TOOLS.md) - Flynn tool catalog

## Support

For issues or questions:

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review existing GitHub issues
3. Create new issue with "MCP Configuration" label

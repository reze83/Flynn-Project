# Flynn Architecture

## Overview

Flynn is an **Expert System** that provides specialized agent contexts to Claude Code through the Model Context Protocol (MCP). Unlike traditional AI agent systems that require API keys to make LLM calls, Flynn provides expertise and workflows that Claude Code uses to become specialized agents.

## Core Principle: Expert System Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                      TRADITIONAL AGENT                       │
├─────────────────────────────────────────────────────────────┤
│  User → Agent → LLM API → Response → User                   │
│                    ↑                                         │
│              Requires API Key                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    FLYNN EXPERT SYSTEM                       │
├─────────────────────────────────────────────────────────────┤
│  User → Claude Code → Flynn MCP → Agent Context → User      │
│              ↑              ↑                                │
│         (Has LLM)    (Provides Expertise)                   │
│                      No API Key Needed!                      │
└─────────────────────────────────────────────────────────────┘
```

## System Components

### 1. MCP Server (`apps/server`)

The entry point for Claude Code integration. Exposes 18 MCP tools:

```typescript
const server = new MCPServer({
  tools: {
    "get-agent-context": getAgentContextTool,
    "orchestrate": orchestrateTool,
    "list-workflows": listWorkflowsTool,
    "codex-delegate": codexDelegateTool,
    "codex-md-generator": codexMdGeneratorTool,
    // ... 13 more tools
  }
});
```

### 2. Agent Contexts (`packages/tools/src/agent-contexts.ts`)

Single source of truth for all 27 agent definitions:

```typescript
interface AgentContext {
  id: string;
  name: string;
  description: string;
  instructions: string;      // System prompt
  tools: string[];           // Recommended MCP tools
  workflow: string[];        // Step-by-step process
  constraints: string[];     // Rules and limits
  outputFormat: string;      // Expected output
  triggers: string[];        // Detection keywords
  capabilities: string[];    // What it can do
  recommendedModel?: "haiku" | "sonnet" | "opus";
  modelRationale?: string;
}
```

### 3. Orchestration (`packages/tools/src/orchestrate.ts`)

Plans multi-agent workflows for complex tasks:

```typescript
const WORKFLOW_TEMPLATES = {
  "full-stack-feature": [
    "api-designer",
    "database-architect",
    "coder",
    "frontend-architect",
    "test-architect",
    "security",
    "devops-engineer"
  ],
  "codex-delegation": ["orchestrator", "coder", "diagnostic"],
  // ...22 total workflows
};
```

### 4. Skills System (`packages/tools/src/skills/`)

Progressive disclosure for token optimization:

```
Tier 1: Metadata Only (~100 tokens)
├── id, name, description, triggers
└── Always loaded for all skills

Tier 2: Full Instructions (<5k tokens)
├── Complete skill content
└── Loaded when skill is activated

Tier 3: External Resources (On-demand)
├── URLs, code examples, docs
└── Loaded when explicitly requested
```

**Token Savings: 70-90%** by loading only what's needed.

### 5. Hooks System (`packages/tools/src/hooks/`)

Generates Claude Code hook configurations:

```typescript
interface HookTemplate {
  id: string;
  name: string;
  events: HookEvent[];  // PreToolUse, PostToolUse, etc.
  config: HooksSettings;
}
```

### 6. Analytics (`packages/tools/src/analytics.ts`)

In-memory usage tracking:

- Session metrics (tokens, messages, cost)
- Tool usage statistics
- Agent activation tracking
- Workflow execution logs

## Data Flow

### Single Agent Task

```
User: "/flynn fix the login bug"
          │
          ▼
┌─────────────────────────────┐
│     route-task (auto)       │
│     Detects: diagnostic     │
└─────────────────────────────┘
          │
          ▼
┌─────────────────────────────┐
│    get-agent-context        │
│    Returns: diagnostic      │
│    - instructions           │
│    - workflow steps         │
│    - constraints            │
└─────────────────────────────┘
          │
          ▼
┌─────────────────────────────┐
│     Claude Code             │
│     BECOMES diagnostic      │
│     agent and executes      │
└─────────────────────────────┘
```

### Multi-Agent Task

```
User: "/flynn build full stack user auth"
          │
          ▼
┌─────────────────────────────┐
│     orchestrate             │
│     Detects: full-stack-    │
│     feature workflow        │
└─────────────────────────────┘
          │
          ▼
┌─────────────────────────────┐
│     Returns 7 agents:       │
│     1. api-designer         │
│     2. database-architect   │
│     3. coder                │
│     4. frontend-architect   │
│     5. test-architect       │
│     6. security             │
│     7. devops-engineer      │
└─────────────────────────────┘
          │
          ▼
┌─────────────────────────────┐
│     Claude Code executes    │
│     each agent sequentially │
│     or in parallel groups   │
└─────────────────────────────┘
```

## Hybrid Model Orchestration

Agents have recommended models based on their complexity:

| Pattern | Model | Use Case |
|---------|-------|----------|
| **Planning** | opus | system-architect, migration-specialist |
| **Analysis** | sonnet | diagnostic, security, reviewer |
| **Execution** | haiku | coder, scaffolder, devops-engineer |

```typescript
// Example: Full-stack feature
"api-designer"         → sonnet (design)
"database-architect"   → sonnet (design)
"coder"               → haiku  (execute)
"frontend-architect"  → sonnet (design)
"test-architect"      → sonnet (plan)
"security"            → sonnet (review)
"devops-engineer"     → haiku  (execute)
```

## Package Structure

```
flynn/
├── apps/
│   └── server/              # MCP Server entry point
│       └── src/
│           └── server.ts    # Tool registration
│
├── packages/
│   ├── core/                # Shared utilities
│   │   ├── logger.ts        # Pino-based logging
│   │   ├── mcp-server.ts    # MCP wrapper
│   │   ├── paths.ts         # XDG paths
│   │   └── policy.ts        # Security rules
│   │
│   ├── tools/               # MCP Tools (main package)
│   │   ├── agent-contexts.ts     # 27 agents
│   │   ├── orchestrate.ts        # 22 workflows
│   │   ├── skills/               # Progressive disclosure
│   │   ├── hooks/                # Hook generation
│   │   ├── analytics.ts          # Usage tracking
│   │   ├── codex-delegate.ts     # Codex integration
│   │   └── ... (18 tools total)
│   │
│   ├── agents/              # RAG & Embeddings
│   │   ├── rag.ts           # Vector search
│   │   └── embeddings.ts    # Local embeddings
│   │
│   ├── analytics/           # Persistent storage (LibSQL)
│   │   ├── collector.ts     # Metrics collection
│   │   └── storage.ts       # Database layer
│   │
│   └── bootstrap/           # Environment detection
│       └── detector.ts      # Package manager detection
│
└── python/                  # Python SDK
    └── flynn_python/
        ├── data_tools.py    # Pandas integration
        └── ml_tools.py      # Hugging Face models
```

## Security Model

### Policy Enforcement

```typescript
// packages/core/src/policy.ts
const BLOCKED_PATTERNS = [
  /rm\s+-rf\s+[\/~]/,           // Dangerous deletions
  />\s*\/dev\/(sd|hd|nvme)/,    // Direct device writes
  /mkfs\./,                      // Filesystem formatting
  // ...
];

const SENSITIVE_PATHS = [
  ".env",
  "credentials",
  "secrets",
  // ...
];
```

### Hook-Based Security

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "if [[ \"$file\" =~ \\.(env|key|pem)$ ]]; then exit 1; fi"
      }]
    }]
  }
}
```

## Local-First Design

Flynn runs entirely locally without external API calls:

- **Embeddings**: `@huggingface/transformers` with `Xenova/all-MiniLM-L6-v2`
- **Vector DB**: LibSQL (SQLite-based)
- **No telemetry**: All data stays local
- **Offline capable**: Works without internet after initial setup

## Extension Points

### Adding New Agents

```typescript
// packages/tools/src/agent-contexts.ts
export const AGENT_CONTEXTS = {
  // Add new agent
  "new-agent": {
    id: "new-agent",
    name: "Flynn New Agent",
    instructions: `...`,
    triggers: ["keyword1", "keyword2"],
    recommendedModel: "sonnet",
    // ...
  }
};
```

### Adding New Workflows

```typescript
// packages/tools/src/orchestrate.ts
const WORKFLOW_TEMPLATES = {
  // Add new workflow
  "new-workflow": ["agent1", "agent2", "agent3"],
};

const TEMPLATE_TRIGGERS = {
  "new-workflow": ["trigger phrase", "another trigger"],
};
```

### Adding New Skills

```typescript
// packages/tools/src/skills/skill-registry.ts
export const SKILL_REGISTRY = {
  "new-skill": {
    id: "new-skill",
    name: "New Skill",
    description: "Tier 1 description",
    instructions: `Tier 2 detailed instructions...`,
    triggers: ["keyword"],
    category: "development",
    tier1TokenEstimate: 50,
    tier2TokenEstimate: 2000,
  }
};
```

## Testing Strategy

```
476 Tests Total
├── Unit Tests (packages/*/___tests__/)
│   ├── Agent context validation
│   ├── Workflow detection
│   ├── Skill loading
│   └── Tool execution
│
├── Integration Tests
│   ├── Multi-agent workflows
│   ├── RAG with local embeddings
│   └── Analytics persistence
│
└── E2E Tests
    └── /flynn command validation
```

## Performance Considerations

1. **Token Optimization**
   - Skills use progressive disclosure (70-90% savings)
   - Agent contexts are loaded on-demand
   - Metadata-first approach

2. **Memory Management**
   - In-memory analytics with periodic persistence
   - Lazy loading of embeddings model
   - Connection pooling for LibSQL

3. **Startup Time**
   - MCP server starts in <100ms
   - Embeddings model loaded on first use (~2s)
   - No warmup required

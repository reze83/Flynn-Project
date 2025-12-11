# Flynn MCP Tools Reference

This document describes all 19 Flynn MCP tools, organized by category.

## Quick Reference

| Category | Tools | Count |
|----------|-------|-------|
| [Routing & Orchestration](#routing--orchestration) | route-task, get-agent-context, orchestrate, list-workflows | 4 |
| [Skills & Hooks](#skills--hooks) | get-skill, list-skills, generate-hooks | 3 |
| [Analysis & Diagnostics](#analysis--diagnostics) | analyze-project, system-info, health-check, heal-error, performance-profiler | 5 |
| [Operations](#operations) | git-ops, file-ops, shell | 3 |
| [Analytics](#analytics) | analytics | 1 |
| [External MCP](#external-mcp-integration) | list-mcp-tools | 1 |
| [Codex Integration](#codex-integration) | codex-delegate, codex-md-generator | 2 |

---

## Routing & Orchestration

### route-task

**Purpose:** Route a development task to the appropriate specialized agent.

| Property | Value |
|----------|-------|
| ID | `route-task` |
| No API Key Required | Yes |

**Input Schema:**
```typescript
{
  message: string  // The task description to route
}
```

**Output Schema:**
```typescript
{
  agent: string         // Recommended agent ID
  confidence: number    // 0-1 confidence score
  reasoning: string     // Why this agent was selected
  capabilities: string[] // What the agent can do
  suggestedAction: string // Recommended next step
}
```

**Example:**
```bash
mcp__flynn__route-task({ message: "fix the login authentication bug" })
```

**Response:**
```json
{
  "agent": "diagnostic",
  "confidence": 0.67,
  "reasoning": "Matched keywords: fix, bug. Debug and diagnose issues in code.",
  "capabilities": ["Analyze errors", "Debug code", "Identify root causes", "Suggest fixes"],
  "suggestedAction": "Use the diagnostic agent to: debug and diagnose issues in code."
}
```

---

### get-agent-context

**Purpose:** Get specialized agent instructions and context for a task.

| Property | Value |
|----------|-------|
| ID | `get-agent-context` |
| No API Key Required | Yes |

**Input Schema:**
```typescript
{
  task: string         // Task description to get context for
  agent?: string       // Specific agent ID (auto-detect if not provided)
}
```

**Output Schema:**
```typescript
{
  agent: string
  confidence: number
  context: {
    name: string
    description: string
    instructions: string    // System prompt for the agent
    tools: string[]         // Recommended tools
    workflow: string[]      // Step-by-step process
    constraints: string[]   // Rules and limits
    outputFormat: string    // Expected output format
  }
}
```

**Example:**
```bash
# Auto-detect agent
mcp__flynn__get-agent-context({ task: "implement user registration" })

# Specific agent
mcp__flynn__get-agent-context({ task: "any task", agent: "security" })
```

---

### orchestrate

**Purpose:** Plan multi-agent workflow for complex tasks.

| Property | Value |
|----------|-------|
| ID | `orchestrate` |
| No API Key Required | Yes |

**Input Schema:**
```typescript
{
  task: string                     // Complex task requiring multiple agents
  workflow?: string                // Explicit workflow name (optional)
  mode?: "auto" | "sequential" | "parallel"  // Execution mode (default: auto)
  parallel_threshold?: number      // Min independent steps for parallelization (default: 2)
  auto_optimize?: boolean          // Auto-detect parallel opportunities (default: true)
}
```

**Output Schema:**
```typescript
{
  template: string         // Workflow template used
  agents: Array<{
    id: string
    role: string
    subtask: string
    instructions: string
    tools: string[]
    workflow: string[]
    constraints: string[]
  }>
  suggestedFlow: "sequential" | "parallel" | "mixed"
  parallelGroups: string[][]
  totalSteps: number
  optimization?: {
    auto_optimized: boolean           // Was auto-optimization applied?
    parallel_opportunities: number    // Number of parallel execution opportunities
    estimated_speedup: string         // e.g., "~1.5x faster"
    independent_groups: Array<{       // Groups that can run in parallel
      agents: string[]
      reason: string
    }>
  }
}
```

**Example:**
```bash
mcp__flynn__orchestrate({ task: "build full stack user authentication" })
```

**Response:**
```json
{
  "template": "full-stack-feature",
  "totalSteps": 7,
  "suggestedFlow": "sequential",
  "agents": [
    { "id": "api-designer-1", "role": "api-designer", ... },
    { "id": "database-architect-2", "role": "database-architect", ... },
    { "id": "coder-3", "role": "coder", ... },
    { "id": "frontend-architect-4", "role": "frontend-architect", ... },
    { "id": "test-architect-5", "role": "test-architect", ... },
    { "id": "security-6", "role": "security", ... },
    { "id": "devops-engineer-7", "role": "devops-engineer", ... }
  ]
}
```

---

### list-workflows

**Purpose:** List all available workflow templates with descriptions.

| Property | Value |
|----------|-------|
| ID | `list-workflows` |
| No API Key Required | Yes |

**Input Schema:**
```typescript
{}  // No input required
```

**Output Schema:**
```typescript
{
  workflows: Array<{
    id: string
    name: string
    description: string
    agents: string[]        // Agent IDs in order
    agentNames: string[]    // Human-readable names
    triggers: string[]      // Keywords to detect this workflow
    useCase: string         // When to use this workflow
  }>
  count: number
}
```

**Available Workflows (22):**

| Workflow | Agents | Use Case |
|----------|--------|----------|
| `new-project` | scaffolder, coder, diagnostic | Starting a new codebase |
| `fix-bug` | diagnostic, coder, diagnostic | Bug investigation + fix |
| `add-feature` | coder, diagnostic | Adding new functionality |
| `refactor` | diagnostic, refactor, diagnostic | Improving code structure |
| `release` | diagnostic, release | Versioning and publishing |
| `setup` | installer, diagnostic | Installing dependencies |
| `analyze` | diagnostic | Code analysis |
| `data-task` | data | Data analysis and ML |
| `recover` | healer | Failure recovery |
| `security-audit` | security | Security scanning |
| `code-review` | reviewer | Quality review |
| `performance-audit` | performance | Performance analysis |
| `full-review` | reviewer, security, performance | Comprehensive review |
| `secure-release` | security, diagnostic, release | Production releases |
| `full-stack-feature` | api-designer, database-architect, coder, frontend-architect, test-architect, security, devops-engineer | End-to-end feature |
| `security-hardening` | security, reviewer, diagnostic, coder | Security fixes |
| `ml-pipeline` | data-engineer, ml-engineer, coder, test-architect, devops-engineer | ML development |
| `incident-response` | diagnostic, incident-responder, coder, healer | Production incidents |
| `codebase-migration` | diagnostic, migration-specialist, coder, test-architect, reviewer, documentation-architect | Framework migrations |
| `documentation-suite` | diagnostic, documentation-architect, api-designer, reviewer | Project documentation |
| `codex-delegation` | orchestrator, coder, diagnostic | Delegate to Codex CLI |
| `hybrid-implementation` | orchestrator, api-designer, orchestrator, diagnostic | Multi-AI workflows |

---

## Skills & Hooks

### get-skill

**Purpose:** Get skill content with Progressive Disclosure (70-90% token savings).

| Property | Value |
|----------|-------|
| ID | `get-skill` |
| Progressive Disclosure | Yes |

**Input Schema:**
```typescript
{
  skillId?: string  // Specific skill ID (e.g., 'typescript-advanced')
  task?: string     // Task description to auto-detect skill
  tier?: 1 | 2 | 3  // Loading tier (default: 2)
}
```

**Tier Levels:**
| Tier | Content | Tokens |
|------|---------|--------|
| 1 | Metadata only (id, name, description, triggers) | ~100 |
| 2 | + Full instructions | ~2000-5000 |
| 3 | + External resources | Variable |

**Output Schema:**
```typescript
{
  success: boolean
  skillId?: string
  tier: number
  confidence: number
  metadata?: {
    id: string
    name: string
    description: string
    category: string
    triggers: string[]
    tier1TokenEstimate: number
    tier2TokenEstimate: number
  }
  instructions?: string
  resources?: string[]
  tokensUsed: number
}
```

**Example:**
```bash
# Full skill (Tier 2)
mcp__flynn__get-skill({ skillId: "typescript-advanced" })

# Metadata only (Tier 1)
mcp__flynn__get-skill({ skillId: "typescript-advanced", tier: 1 })

# Auto-detect from task
mcp__flynn__get-skill({ task: "write async python code" })
```

---

### list-skills

**Purpose:** List available skills with metadata only (efficient discovery).

| Property | Value |
|----------|-------|
| ID | `list-skills` |
| Tier 1 Only | Yes |

**Input Schema:**
```typescript
{
  category?: "development" | "devops" | "testing" | "architecture" | "data" | "security" | "productivity"
  task?: string  // Find skills matching a task description
}
```

**Output Schema:**
```typescript
{
  skills: Array<{
    id: string
    name: string
    description: string
    category: string
    triggers: string[]
    tier1TokenEstimate: number
    tier2TokenEstimate: number
    confidence?: number  // Only when matched by task
  }>
  totalSkills: number
  categories: string[]
  totalTier1Tokens: number
  matchedByTask: boolean
}
```

**Available Skills (17):**

| Skill ID | Category | Description |
|----------|----------|-------------|
| `typescript-advanced` | development | Advanced TypeScript patterns |
| `python-patterns` | development | Python async and testing |
| `systematic-debugging` | development | Four-phase debugging framework |
| `root-cause-tracing` | development | 5 Whys, Fault Tree, Fishbone |
| `mcp-builder` | development | MCP server creation guide |
| `api-design` | architecture | REST, GraphQL, OpenAPI |
| `kubernetes-ops` | devops | K8s, Helm, GitOps |
| `terraform-iac` | devops | Multi-cloud IaC |
| `testing-strategies` | testing | Unit, Integration, E2E |
| `test-driven-development` | testing | Red-Green-Refactor TDD |
| `verification-before-completion` | testing | Multi-level verification |
| `brainstorming` | productivity | Structured ideation patterns |
| `writing-plans` | productivity | Implementation planning |
| `executing-plans` | productivity | Step-by-step execution |
| `dispatching-parallel-agents` | productivity | Parallel agent orchestration |
| `defense-in-depth` | security | Multi-layered security |
| `prompt-engineering` | ai | LLM prompt patterns & best practices |

---

### generate-hooks

**Purpose:** Generate Claude Code hook configurations from templates.

| Property | Value |
|----------|-------|
| ID | `generate-hooks` |
| Output | settings.json format |

**Input Schema:**
```typescript
{
  templates?: string[]   // Template IDs to use
  category?: "formatting" | "security" | "testing" | "logging" | "workflow"
  listOnly?: boolean     // Only list templates (default: false)
  outputFormat?: "json" | "settings"  // Output format (default: settings)
}
```

**Output Schema:**
```typescript
{
  success: boolean
  templates?: Array<{
    id: string
    name: string
    description: string
    category: string
    events: string[]  // PreToolUse, PostToolUse, etc.
  }>
  config?: Record<string, any>  // Hook configuration
  settingsPath?: string
  instructions?: string
}
```

**Available Hook Templates (10):**
| Template ID | Category | Description |
|-------------|----------|-------------|
| `auto-format-prettier` | formatting | Format on edit with Prettier |
| `auto-format-biome` | formatting | Format with Biome |
| `block-sensitive-files` | security | Block .env access |
| `block-dangerous-commands` | security | Block rm -rf etc. |
| `run-tests-on-change` | testing | Auto-run tests |
| `tdd-enforcement` | testing | Require tests first |
| `session-logging` | logging | Log sessions |
| `git-safe-commits` | workflow | Safe git operations |

**Example:**
```bash
# List all templates
mcp__flynn__generate-hooks({ listOnly: true })

# Generate security hooks
mcp__flynn__generate-hooks({ category: "security" })

# Generate specific templates
mcp__flynn__generate-hooks({ templates: ["auto-format-prettier", "block-sensitive-files"] })
```

---

## Analysis & Diagnostics

### analyze-project

**Purpose:** Analyze project directory structure and provide insights.

| Property | Value |
|----------|-------|
| ID | `analyze-project` |
| Local-only | Yes |

**Input Schema:**
```typescript
{
  projectPath: string  // Path to the project directory
  maxDepth?: number    // Maximum directory depth to scan (default: 3)
}
```

**Output Schema:**
```typescript
{
  name: string
  type: string
  files: number
  directories: number
  languages: string[]
  frameworks: string[]
  error?: string
}
```

**Example:**
```bash
mcp__flynn__analyze-project({ projectPath: "/home/user/my-project" })
```

**Response:**
```json
{
  "name": "my-project",
  "type": "Node.js",
  "files": 156,
  "directories": 24,
  "languages": ["TypeScript", "JavaScript"],
  "frameworks": ["Node.js"]
}
```

---

### system-info

**Purpose:** Get information about the system environment.

| Property | Value |
|----------|-------|
| ID | `system-info` |
| No Input Required | Yes |

**Output Schema:**
```typescript
{
  platform: string    // 'linux', 'darwin', 'win32'
  arch: string        // 'x64', 'arm64'
  release: string     // OS release version
  hostname: string
  homeDir: string
  nodeVersion: string
  isWSL: boolean      // Running in WSL?
}
```

**Example:**
```bash
mcp__flynn__system-info()
```

---

### health-check

**Purpose:** Perform system health checks including environment, dependencies, and configuration validation.

| Property | Value |
|----------|-------|
| ID | `health-check` |
| Comprehensive | Yes |

**Input Schema:**
```typescript
{
  checks?: Array<"environment" | "dependencies" | "configuration" | "mcp" | "all">
  projectPath?: string  // Defaults to cwd
}
```

**Output Schema:**
```typescript
{
  healthy: boolean
  timestamp: string
  summary: {
    passed: number
    failed: number
    warnings: number
  }
  checks: Array<{
    name: string
    status: "pass" | "fail" | "warn"
    message: string
    details?: Record<string, any>
  }>
  recommendations: string[]
}
```

**Check Categories:**
| Category | Checks |
|----------|--------|
| `environment` | Node.js, pnpm, Python, Git, OS |
| `dependencies` | package.json, node_modules, lock file |
| `configuration` | tsconfig.json, linter, .gitignore, .claude |
| `mcp` | MCP server status, Claude settings |

**Example:**
```bash
# Full health check
mcp__flynn__health-check({ checks: ["all"] })

# Environment only
mcp__flynn__health-check({ checks: ["environment"] })
```

---

### heal-error

**Purpose:** Analyze an error and provide recovery strategies.

| Property | Value |
|----------|-------|
| ID | `heal-error` |
| Used By | healer agent |

**Input Schema:**
```typescript
{
  error: string           // The error message or stack trace
  context?: string        // Additional context
  previousAction?: string // Action that caused the error
  retryCount?: number     // Previous retry attempts (default: 0)
}
```

**Output Schema:**
```typescript
{
  category: string        // Error category
  diagnosis: string       // Analysis of the error
  strategies: string[]    // Recommended recovery steps
  suggestedAction: string // First action to try
  shouldRetry: boolean    // Is this retryable?
  maxRetries: number      // Maximum retry attempts (3)
  remainingRetries: number
  healerInstructions: string // Full recovery guide
  escalate: boolean       // Should escalate to user?
}
```

**Error Categories:**
| Category | Pattern | Retryable |
|----------|---------|-----------|
| File System | ENOENT, file not found | Yes |
| Permissions | EACCES, permission denied | No |
| Network | ECONNREFUSED, timeout | Yes |
| Dependencies | cannot find module | Yes |
| Syntax | syntax error, unexpected token | No |
| Type Error | is not a function, undefined | No |
| Resources | out of memory, ENOMEM | No |
| Timeout | timeout, timed out | Yes |
| Git | merge conflict, detached head | Yes |
| Build | build failed, compilation error | Yes |

**Example:**
```bash
mcp__flynn__heal-error({
  error: "ENOENT: no such file or directory, open '/app/config.json'",
  previousAction: "Reading configuration"
})
```

---

### performance-profiler

**Purpose:** Measure execution time of a local module’s function.

| Property | Value |
|----------|-------|
| ID | `performance-profiler` |
| Timing | Yes |

**Input Schema:**
```typescript
{
  modulePath: string   // Relative or absolute path to the module
  functionName: string // Exported function name to execute
  args?: any[]         // Arguments passed to the function (default: [])
}
```

**Output Schema:**
```typescript
{
  durationMs: number   // Execution time in milliseconds
  result?: any         // Return value of the function
  error?: string       // Error message if execution failed
}
```

**Example:**
```bash
mcp__flynn__performance-profiler({
  modulePath: "./packages/core/src/logger.js",
  functionName: "createLogger",
  args: ["example"]
})
```

**Response:**
```json
{
  "durationMs": 0.23,
  "result": { /* return value of createLogger */ }
}
```

---

## Operations

### git-ops

**Purpose:** Git operations (status, log, diff, branch).

| Property | Value |
|----------|-------|
| ID | `git-ops` |
| Safe Operations | Yes |

**Input Schema:**
```typescript
{
  operation: "status" | "log" | "diff" | "branch"
  path?: string    // Repository path (default: ".")
  count?: number   // Commits to show for log (default: 10)
  staged?: boolean // Show staged changes for diff (default: false)
}
```

**Output Schema:**
```typescript
{
  success: boolean
  operation: string
  output: string
  error?: string
}
```

**Example:**
```bash
# Git status
mcp__flynn__git-ops({ operation: "status" })

# Recent commits
mcp__flynn__git-ops({ operation: "log", count: 5 })

# Staged changes
mcp__flynn__git-ops({ operation: "diff", staged: true })

# List branches
mcp__flynn__git-ops({ operation: "branch" })
```

---

### file-ops

**Purpose:** File operations (read, write, exists, list).

| Property | Value |
|----------|-------|
| ID | `file-ops` |
| Safe Operations | Yes |

**Input Schema:**
```typescript
{
  operation: "read" | "write" | "exists" | "list"
  path: string        // File or directory path
  content?: string    // Content for write operation
  createDirs?: boolean // Create parent directories (default: true)
  recursive?: boolean  // List recursively (default: false)
}
```

**Output Schema:**
```typescript
{
  success: boolean
  operation: string
  result?: string      // File content or write confirmation
  exists?: boolean     // For exists operation
  files?: string[]     // For list operation
  error?: string
}
```

**Example:**
```bash
# Read file
mcp__flynn__file-ops({ operation: "read", path: "/app/config.json" })

# Write file
mcp__flynn__file-ops({ operation: "write", path: "/app/output.txt", content: "Hello" })

# Check existence
mcp__flynn__file-ops({ operation: "exists", path: "/app/config.json" })

# List directory
mcp__flynn__file-ops({ operation: "list", path: "/app/src", recursive: true })
```

---

### shell

**Purpose:** Execute shell commands safely with allowlist/blocklist.

| Property | Value |
|----------|-------|
| ID | `shell` |
| Security | Allowlist + Blocklist |

**Input Schema:**
```typescript
{
  command: string       // Shell command to execute
  cwd?: string          // Working directory
  timeout?: number      // Timeout in ms (default: 30000)
  allowUnsafe?: boolean // Allow commands not in safe list (default: false)
}
```

**Output Schema:**
```typescript
{
  success: boolean
  command: string
  stdout: string
  stderr?: string
  error?: string
  blocked?: boolean
}
```

**Allowed Commands (Safe List):**
- `git`, `pnpm`, `npm`, `uv`, `node`, `python`
- `ls`, `cat`, `grep`, `find`, `mkdir`, `touch`, `cp`, `mv`
- `echo`, `pwd`, `which`, `whoami`, `date`

**Blocked Patterns:**
- `rm -rf /` (recursive delete root)
- `sudo` (privilege escalation)
- `chmod 777` (dangerous permissions)
- `> /dev/sda` (device writes)
- `curl|bash`, `wget|bash` (remote execution)
- Fork bombs

**Example:**
```bash
# Safe command
mcp__flynn__shell({ command: "git status" })

# Blocked command (returns error)
mcp__flynn__shell({ command: "rm -rf /" })
# Response: { blocked: true, error: "Command matches blocked pattern" }
```

---

## Analytics

### analytics

**Purpose:** Track and query Flynn usage analytics.

| Property | Value |
|----------|-------|
| ID | `analytics` |
| Storage | In-memory |

**Input Schema:**
```typescript
{
  action: "start-session" | "end-session" | "record-message" |
          "record-tool" | "record-agent" | "record-workflow" |
          "get-session" | "get-summary" | "get-tool-stats" |
          "get-agent-stats" | "reset"

  // Session actions
  sessionId?: string

  // Record message
  inputTokens?: number
  outputTokens?: number
  model?: "haiku" | "sonnet" | "opus"

  // Record tool
  toolName?: string
  durationMs?: number
  success?: boolean

  // Record agent
  agentId?: string
  tokenCount?: number

  // Record workflow
  workflowId?: string
  stepsCompleted?: number
  totalSteps?: number

  // Query options
  days?: number
  limit?: number
}
```

**Actions:**

| Action | Description |
|--------|-------------|
| `start-session` | Start tracking a new session |
| `end-session` | End current session |
| `record-message` | Record token usage |
| `record-tool` | Record tool usage |
| `record-agent` | Record agent activation |
| `record-workflow` | Record workflow execution |
| `get-session` | Get session metrics |
| `get-summary` | Get usage summary |
| `get-tool-stats` | Get tool statistics |
| `get-agent-stats` | Get agent statistics |
| `reset` | Reset all analytics |

**Cost Estimation (Dec 2024):**
| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|----------------------|
| haiku | $0.25 | $1.25 |
| sonnet | $3.00 | $15.00 |
| opus | $15.00 | $75.00 |

**Example:**
```bash
# Start session
mcp__flynn__analytics({ action: "start-session" })

# Record message
mcp__flynn__analytics({
  action: "record-message",
  inputTokens: 500,
  outputTokens: 1000,
  model: "sonnet"
})

# Get summary
mcp__flynn__analytics({ action: "get-summary" })
```

**Summary Response:**
```json
{
  "success": true,
  "action": "get-summary",
  "summary": {
    "totalSessions": 5,
    "totalTokens": 125000,
    "totalCost": 2.25,
    "avgTokensPerSession": 25000
  }
}
```

---

## External MCP Integration

### list-mcp-tools

**Purpose:** List available external MCP tools from other servers. Discovers tools for search, research, code analysis, documentation, memory, and more.

| Property | Value |
|----------|-------|
| ID | `list-mcp-tools` |
| Auto-discovery | Yes |

**Input Schema:**
```typescript
{
  category?: "search" | "research" | "code-analysis" | "documentation" | "memory" | "thinking" | "file-ops" | "shell" | "git" | "all"
  server?: string   // Filter by server name
  task?: string     // Get recommendations for a specific task
}
```

**Output Schema:**
```typescript
{
  success: boolean
  tools: Array<{
    name: string
    server: string
    category: string
    description: string
    recommended?: boolean
    relevanceScore?: number
  }>
  totalTools: number
  servers: string[]
  categories: string[]
}
```

**Discovery Sources:**
- Environment variable `FLYNN_MCP_TOOLS`
- Config file `~/.flynn/mcp-tools.json`
- Claude settings `~/.claude/settings.json` (auto-discovery)

**Example:**
```bash
# List all external tools
mcp__flynn__list-mcp-tools({ category: "all" })

# Find search tools
mcp__flynn__list-mcp-tools({ category: "search" })

# Get task-specific recommendations
mcp__flynn__list-mcp-tools({ task: "research API documentation" })
```

---

## Codex Integration

### codex-delegate

**Purpose:** Delegate tasks to OpenAI Codex CLI with proper context handoff.

| Property | Value |
|----------|-------|
| ID | `codex-delegate` |
| External Integration | Yes |

**Input Schema:**
```typescript
{
  operation: "delegate" | "resume" | "status" | "configure"
  task?: string              // Task description for delegation
  sessionId?: string         // Session ID for resume/status
  workingDir?: string        // Working directory for execution
  timeout?: number           // Timeout in ms (default: 300000)
  context?: {
    files?: string[]         // Relevant files
    requirements?: string    // Additional requirements
    constraints?: string[]   // Constraints to follow
  }
}
```

**Output Schema:**
```typescript
{
  success: boolean
  operation: string
  sessionId?: string
  result?: string
  status?: "running" | "completed" | "failed"
  error?: string
}
```

**Example:**
```bash
# Delegate a task
mcp__flynn__codex-delegate({
  operation: "delegate",
  task: "implement pagination for the API",
  context: {
    files: ["src/api/users.ts"],
    requirements: "Use cursor-based pagination"
  }
})
```

---

### codex-md-generator

**Purpose:** Generate CODEX.md files for OpenAI Codex CLI with role-based templates.

| Property | Value |
|----------|-------|
| ID | `codex-md-generator` |
| Templates | worker, peer, specialist |

**Input Schema:**
```typescript
{
  operation: "generate" | "preview" | "analyze"
  projectPath: string        // Path to project directory
  role?: "worker" | "peer" | "specialist"  // Template role (default: worker)
  taskDescription?: string   // Current task description
  relevantFiles?: string[]   // Files relevant to task
  customInstructions?: string
  includeProjectInfo?: boolean  // Include auto-detected project info (default: true)
}
```

**Output Schema:**
```typescript
{
  success: boolean
  operation: string
  content?: string           // CODEX.md content
  outputPath?: string        // Where the file was written
  projectInfo?: {
    type: string
    languages: string[]
    frameworks: string[]
  }
  error?: string
}
```

**Role Templates:**
| Role | Description |
|------|-------------|
| `worker` | Task executor, follows instructions precisely |
| `peer` | Collaborative partner, can suggest alternatives |
| `specialist` | Domain expert, provides in-depth expertise |

**Example:**
```bash
# Generate CODEX.md for delegation
mcp__flynn__codex-md-generator({
  operation: "generate",
  projectPath: "/home/user/project",
  role: "worker",
  taskDescription: "Implement user authentication"
})
```

---

## Cache and Audit Logging

Flynn caches certain tool results locally to improve performance. Embedding
vectors and project analysis summaries are persisted in the `.flynn_cache`
directory (the location can be overridden by setting the `FLYNN_CACHE_DIR`
environment variable). Repeated calls to the embedding or project analysis
tools with identical inputs will reuse cached data instead of recomputing it.
Flynn also writes structured audit logs of tool invocations to
`.flynn_cache/audit.log`. To clear all caches and logs, remove the
`.flynn_cache` directory; it will be recreated automatically on the next
execution.

---

## See Also

- [AGENTS.md](./AGENTS.md) - All 27 Flynn Agents
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System Design
- [README.md](../README.md) - Quick Start Guide

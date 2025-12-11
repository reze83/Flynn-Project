# Changelog

All notable changes to Flynn will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Auto-Parallel Optimization** — Orchestrate tool now auto-detects parallel execution opportunities based on agent dependency graph
  - New `parallel_threshold` parameter (default: 2) - minimum independent steps for parallelization
  - New `auto_optimize` parameter (default: true) - enables dependency-based parallel detection
  - Returns `optimization` object with speedup estimates and independent agent groups
  - Agent dependencies: review agents, architecture agents can run in parallel
- **Sequential Thinking Integration** — Added "thinking" category to agent MCP recommendations for complex reasoning tasks
  - Diagnostic, reviewer, performance, healer, architects, and more now recommend `mcp__sequentialthinking-tools__sequentialthinking_tools`
- **16 MCP Tools** — Added `list-mcp-tools` for external MCP discovery (was 15)
- **AI Skills Category** — New "ai" skill category for LLM/prompt engineering patterns
- **prompt-engineering Skill** — Comprehensive prompt patterns (~3500 tokens) including:
  - Chain-of-Thought (CoT) prompting
  - Few-Shot learning patterns
  - Role-Based/Persona prompting
  - Structured output formats (JSON, XML)
  - Claude-specific best practices
  - Anti-patterns and optimization techniques
- **17 Skills** — Added `prompt-engineering` to existing 16 skills
- **Documentation Suite Workflow** — New `documentation-suite` workflow for comprehensive project documentation
- **20 Workflows** — Added `documentation-suite` to existing 19 workflows
- **ADRs** — Architecture Decision Records for security, performance, and agent architecture
- **CONTRIBUTING.md** — Comprehensive contributor guide
- **TROUBLESHOOTING.md** — Common issues and solutions
- **Installer Error Handler** — Enhanced error handling in `install-flynn.sh` with:
  - Stack trace display in debug mode (`DEBUG=true`)
  - Command location tracking (file:line)
  - Exit code reporting
  - Automatic rollback on installation failures
- **Installer Signal Handlers** — Graceful interrupt handling (SIGINT/SIGTERM):
  - Cleanup of spinner processes
  - Optional rollback prompt in interactive mode
  - Proper signal logging

### Security
- **Shell Hardening** — Removed `allowUnsafe` bypass, expanded blocked patterns from 9 to 22
- **Path Traversal Protection** — Added `isPathWithinBase()` validation
- **Safe JSON Parsing** — Prevent prototype pollution attacks
- **Fail-Closed Policy** — Changed from fail-open to fail-closed for security checks
- **Plugin Installer Validation** — Package names and Git URLs are now validated before shell execution to prevent command injection

### Performance
- **Trigger Index** — O(1) lookups for task routing instead of O(agents × triggers)
- **Circular Buffers** — Bounded memory for event/token history (prevents unbounded growth)
- **Async Shell Execution** — Non-blocking command execution with AbortController
- **Skills Registry Caching** — Metadata and category lookups are now cached for faster access

### Fixed
- **Sequential Thinking Server Name** — Fixed MCP registry server name from "sequential-thinking" to "sequentialthinking-tools"
- **Installer log_action Exit Behavior** — Fixed `lib/common.sh:log_action()` where `[[ ... ]] && echo` pattern caused premature exit with `set -e`
- **Installer Arithmetic Expansion** — Fixed `lib/verify.sh` where `((errors++))` returned exit code 1 when errors=0, causing false failures
- **Installer Clone Reliability** — Improved `lib/installers.sh:clone_repository()` with retry logic and better error handling

### Changed
- **Directory Recursion Limit** — MAX_DEPTH=10 for file listing operations
- **Production Build Config** — New `tsconfig.prod.json` without source maps
- **Documentation Requirement** — Optimization agents (refactor, performance, reviewer, security, coder) now require official documentation before making suggestions

### Improved
- **Installer Array Processing** — Safe null-delimited array processing in `lib/rollback.sh` using `find -print0` and `read -d ''` to handle filenames with spaces

## [1.0.0] - 2025-12-07

### Added
- **26 Specialized Agents** — Core, Architecture, Operations, and Domain agents
- **19 Multi-Agent Workflows** — From `fix-bug` to `full-stack-feature`
- **15 MCP Tools** — Task routing, orchestration, skills, hooks, analytics
- **Progressive Disclosure** — Tier-based context loading (70-90% token savings)
- **Hybrid Model Selection** — Automatic opus/sonnet/haiku recommendations
- **Policy Profiles** — default, strict, and airgapped security profiles
- **Analytics Dashboard** — Real-time usage tracking with LibSQL
- **Plugin Framework** — Extensible plugin system
- **Python Tools** — Data analysis and ML capabilities
- CLI, Dashboard, Plugins, Analytics packages
- 522 passing tests

### Agents by Category

**Core Agents:**
- coder, diagnostic, scaffolder, installer, refactor, release, healer, data, security, reviewer, performance

**Architecture Agents:**
- system-architect, database-architect, frontend-architect, api-designer

**Operations Agents:**
- devops-engineer, terraform-expert, kubernetes-operator, incident-responder

**Domain Agents:**
- migration-specialist, test-architect, documentation-architect, ml-engineer, data-engineer, mobile-developer, blockchain-developer

### Workflows
- `new-project` — Create new projects from scratch
- `fix-bug` — Diagnose and fix bugs
- `add-feature` — Implement new features
- `refactor` — Improve code structure
- `release` — Prepare releases
- `setup` — Environment setup
- `analyze` — Code analysis
- `data-task` — Data processing
- `recover` — Failure recovery
- `security-audit` — Security scanning
- `code-review` — Code quality review
- `performance-audit` — Performance optimization
- `full-review` — Comprehensive review
- `secure-release` — Security-checked releases
- `full-stack-feature` — End-to-end feature development
- `security-hardening` — Security fixes
- `ml-pipeline` — ML pipeline creation
- `incident-response` — Production incident handling
- `codebase-migration` — Framework migrations

### Tools
- `route-task` — Intelligent task routing
- `get-agent-context` — Agent context retrieval
- `orchestrate` — Multi-agent workflow planning
- `list-workflows` — Available workflows
- `get-skill` — Skill retrieval
- `list-skills` — Available skills
- `generate-hooks` — Hook configuration generation
- `heal-error` — Error recovery
- `health-check` — System health checks
- `analytics` — Usage analytics
- `git-ops` — Git operations
- `file-ops` — File operations
- `shell` — Shell command execution
- `analyze-project` — Project analysis
- `system-info` — System information

### Infrastructure
- Monorepo with pnpm workspaces
- TypeScript with strict mode
- Biome for linting and formatting
- Vitest for testing
- GitHub Actions CI/CD
- LibSQL for analytics storage
- MCP (Model Context Protocol) integration

### Fixed
- Lint/type/build issues across all packages
- Plugin package tests now runnable in isolation
- Removed legacy agents scaffolding as intended cleanup

---

[Unreleased]: https://github.com/reze83/Flynn-Project/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/reze83/Flynn-Project/releases/tag/v1.0.0

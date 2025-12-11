# Flynn Skills Reference

Flynn Skills provide specialized knowledge and instructions using **Progressive Disclosure** to optimize token usage (70-90% savings).

## Overview

| Category | Skills | Description |
|----------|--------|-------------|
| **Development** (5) | typescript-advanced, python-patterns, systematic-debugging, root-cause-tracing, mcp-builder | Code patterns and debugging |
| **Architecture** (1) | api-design | API design patterns |
| **DevOps** (2) | kubernetes-ops, terraform-iac | Infrastructure and deployment |
| **Testing** (3) | testing-strategies, test-driven-development, verification-before-completion | Testing methodologies |
| **Productivity** (4) | brainstorming, writing-plans, executing-plans, dispatching-parallel-agents | Planning and execution |
| **Security** (1) | defense-in-depth | Security patterns |
| **AI** (1) | prompt-engineering | LLM prompt patterns |

**Total: 17 Skills**

---

## Progressive Disclosure (3-Tier System)

Skills load progressively to minimize token usage:

| Tier | Content | Typical Tokens | Use Case |
|------|---------|----------------|----------|
| **Tier 1** | Metadata only (id, name, description, triggers) | ~50-100 | Discovery, listing |
| **Tier 2** | + Full instructions | ~1500-5000 | Active task execution |
| **Tier 3** | + External resources | Variable | Deep reference |

**Token Savings:** Loading Tier 1 for discovery + Tier 2 only when needed saves 70-90% compared to loading all skills.

## Performance

The skills registry uses caching for optimal performance:

- **Metadata Cache**: `getAllSkillMetadata()` results are cached after first call
- **Category Cache**: `getSkillsByCategory()` results are cached per category
- **Cache Invalidation**: Use `invalidateSkillCache()` if skills are dynamically added

---

## Development Skills

### typescript-advanced
**Advanced TypeScript Patterns**

Covers generics, type inference, conditional types, mapped types, and advanced patterns for building type-safe applications.

```bash
mcp__flynn__get-skill({ skillId: "typescript-advanced" })
```

**Triggers:** typescript, ts, types, generics, type inference

---

### python-patterns
**Python Async & Testing**

Async/await patterns, pytest testing strategies, type hints, and Python best practices.

```bash
mcp__flynn__get-skill({ skillId: "python-patterns" })
```

**Triggers:** python, py, async, pytest, asyncio

---

### systematic-debugging
**Four-Phase Debugging Framework**

Structured approach to debugging:
1. **Reproduce** - Consistently trigger the bug
2. **Isolate** - Narrow down the cause
3. **Fix** - Apply targeted solution
4. **Verify** - Confirm resolution

```bash
mcp__flynn__get-skill({ skillId: "systematic-debugging" })
```

**Triggers:** debug, bug, error, fix, issue, problem, crash

---

### root-cause-tracing
**5 Whys, Fault Tree, Fishbone**

Root cause analysis techniques:
- **5 Whys** - Keep asking "why" to find root cause
- **Fault Tree Analysis** - Top-down failure analysis
- **Fishbone/Ishikawa** - Categorized cause analysis

```bash
mcp__flynn__get-skill({ skillId: "root-cause-tracing" })
```

**Triggers:** root cause, why, cause, origin, source, trace

---

### mcp-builder
**MCP Server Creation Guide**

Complete guide for building Model Context Protocol servers:
- Server setup with Python/TypeScript
- Tool and resource definitions
- Claude Code integration
- Testing and deployment

```bash
mcp__flynn__get-skill({ skillId: "mcp-builder" })
```

**Triggers:** mcp, server, build mcp, create mcp, mcp tool

---

## Architecture Skills

### api-design
**REST, GraphQL, OpenAPI**

API design best practices:
- RESTful conventions
- GraphQL schema design
- OpenAPI/Swagger documentation
- Versioning strategies

```bash
mcp__flynn__get-skill({ skillId: "api-design" })
```

**Triggers:** api, rest, graphql, openapi, endpoint, route

---

## DevOps Skills

### kubernetes-ops
**K8s, Helm, GitOps**

Kubernetes operations:
- Pod and service management
- Helm chart development
- GitOps workflows (ArgoCD, Flux)
- Troubleshooting patterns

```bash
mcp__flynn__get-skill({ skillId: "kubernetes-ops" })
```

**Triggers:** kubernetes, k8s, helm, pod, container, cluster

---

### terraform-iac
**Multi-Cloud Infrastructure as Code**

Terraform patterns:
- Module development
- State management
- Multi-environment setup
- AWS, GCP, Azure providers

```bash
mcp__flynn__get-skill({ skillId: "terraform-iac" })
```

**Triggers:** terraform, iac, infrastructure, aws, cloud, provision

---

## Testing Skills

### testing-strategies
**Unit, Integration, E2E Testing**

Comprehensive testing pyramid:
- Unit tests with Vitest/Jest/Pytest
- Integration testing patterns
- E2E with Playwright/Cypress
- Mocking strategies

```bash
mcp__flynn__get-skill({ skillId: "testing-strategies" })
```

**Triggers:** test, testing, unit test, integration, e2e, mock, vitest

---

### test-driven-development
**Red-Green-Refactor TDD**

TDD methodology:
1. **Red** - Write failing test first
2. **Green** - Write minimal code to pass
3. **Refactor** - Improve without breaking tests

Includes patterns: Test List, Triangulation, Fake It.

```bash
mcp__flynn__get-skill({ skillId: "test-driven-development" })
```

**Triggers:** tdd, test first, red green refactor, test driven

---

### verification-before-completion
**Multi-Level Verification Checklist**

Never mark work "done" without verification:
- Level 1: Self-review
- Level 2: Automated checks (tests, lint, build)
- Level 3: Manual testing
- Level 4: Integration check

```bash
mcp__flynn__get-skill({ skillId: "verification-before-completion" })
```

**Triggers:** verify, validate, check, complete, done, quality

---

## Productivity Skills

### brainstorming
**Structured Ideation Patterns**

Creative problem-solving techniques:
- Mind mapping
- SCAMPER method
- Six Thinking Hats
- Constraint-based ideation

```bash
mcp__flynn__get-skill({ skillId: "brainstorming" })
```

**Triggers:** brainstorm, ideas, creative, ideate, think, options

---

### writing-plans
**Implementation Planning**

Structured planning methodology:
- Requirements breakdown
- Task decomposition
- Dependency mapping
- Risk identification

```bash
mcp__flynn__get-skill({ skillId: "writing-plans" })
```

**Triggers:** plan, planning, design, architect, strategy, roadmap

---

### executing-plans
**Step-by-Step Execution**

Plan execution framework:
- Progress tracking
- Checkpoint verification
- Adaptation patterns
- Completion criteria

```bash
mcp__flynn__get-skill({ skillId: "executing-plans" })
```

**Triggers:** execute, implement, build, develop, create, do

---

### dispatching-parallel-agents
**Parallel Agent Orchestration**

Multi-agent coordination:
- Task parallelization patterns
- Agent selection criteria
- Result aggregation
- Error handling in parallel flows

```bash
mcp__flynn__get-skill({ skillId: "dispatching-parallel-agents" })
```

**Triggers:** parallel, agents, dispatch, concurrent, orchestrate, multi-agent

---

## Security Skills

### defense-in-depth
**Multi-Layered Security**

Security layers:
1. **Perimeter** - Firewall, DDoS, WAF
2. **Application** - Input validation, auth
3. **Data** - Encryption, access control
4. **Infrastructure** - Least privilege, secrets

Includes OWASP Top 10 mitigations.

```bash
mcp__flynn__get-skill({ skillId: "defense-in-depth" })
```

**Triggers:** security, defense, protect, secure, vulnerability, attack

---

## AI Skills

### prompt-engineering
**Prompt Engineering Patterns**

Comprehensive prompt patterns for LLM interactions:
- Chain-of-Thought (CoT) prompting
- Few-Shot learning patterns
- Role-Based/Persona prompting
- Structured output formats (JSON, XML)
- Claude-specific best practices

```bash
mcp__flynn__get-skill({ skillId: "prompt-engineering" })
```

**Triggers:** prompt, llm, claude, few-shot, chain-of-thought, cot, system prompt

---

## Usage Examples

### List all skills
```bash
mcp__flynn__list-skills({})
```

### Filter by category
```bash
mcp__flynn__list-skills({ category: "development" })
```

### Auto-detect skill from task
```bash
mcp__flynn__get-skill({ task: "debug this authentication error" })
# Returns: systematic-debugging (auto-detected)
```

### Get specific skill
```bash
mcp__flynn__get-skill({ skillId: "test-driven-development", tier: 2 })
```

### Discovery (Tier 1 only)
```bash
mcp__flynn__get-skill({ skillId: "defense-in-depth", tier: 1 })
# Returns metadata only (~50 tokens)
```

---

## See Also

- [TOOLS.md](./TOOLS.md) - All 18 MCP Tools
- [AGENTS.md](./AGENTS.md) - All 27 Agents
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System Design
- [README.md](../README.md) - Quick Start

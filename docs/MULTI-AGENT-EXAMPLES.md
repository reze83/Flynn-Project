# Multi-Agent Workflow Examples

This document provides practical examples of Flynn's multi-agent workflows.

## Overview

Flynn orchestrates multiple agents to handle complex tasks. Each workflow chains agents together, with each agent's output informing the next agent's context.

---

## Example 1: Full-Stack Feature Development

**Workflow:** `full-stack-feature`
**Agents:** 7 (api-designer → database-architect → coder → frontend-architect → test-architect → security → devops-engineer)

### Trigger

```bash
/flynn implement a complete user authentication feature with social login
```

### Execution Flow

```
┌─────────────────┐
│  api-designer   │ ◄── Designs REST/GraphQL API endpoints
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ database-architect  │ ◄── Designs user schema, sessions, OAuth tokens
└────────┬────────────┘
         │
         ▼
┌─────────────────┐
│     coder       │ ◄── Implements backend logic
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ frontend-architect  │ ◄── Designs UI components, auth flow
└────────┬────────────┘
         │
         ▼
┌─────────────────┐
│  test-architect │ ◄── Creates test strategy, writes tests
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    security     │ ◄── Reviews for OWASP vulnerabilities
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ devops-engineer │ ◄── Sets up CI/CD, secrets management
└─────────────────┘
```

### What Each Agent Does

1. **API Designer** (opus)
   - Designs `/auth/login`, `/auth/register`, `/auth/oauth/{provider}`
   - Defines request/response schemas
   - Documents rate limiting requirements

2. **Database Architect** (sonnet)
   - Creates `users`, `sessions`, `oauth_accounts` tables
   - Designs indexes for performance
   - Plans migration strategy

3. **Coder** (sonnet)
   - Implements authentication service
   - Integrates OAuth providers
   - Writes session management

4. **Frontend Architect** (sonnet)
   - Designs login/register components
   - Plans OAuth redirect flow
   - Implements token storage

5. **Test Architect** (sonnet)
   - Creates unit tests for auth service
   - Designs integration tests
   - Plans E2E auth flow tests

6. **Security** (sonnet)
   - Reviews for SQL injection
   - Checks token handling
   - Validates OAuth implementation

7. **DevOps Engineer** (haiku)
   - Configures GitHub Actions
   - Sets up secret management
   - Deploys to staging

---

## Example 2: Incident Response

**Workflow:** `incident-response`
**Agents:** 4 (diagnostic → incident-responder → coder → healer)

### Trigger

```bash
/flynn production is down, users can't log in, error rate spiked to 80%
```

### Execution Flow

```
┌─────────────────┐
│   diagnostic    │ ◄── Identifies root cause
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ incident-responder  │ ◄── Coordinates response
└────────┬────────────┘
         │
         ▼
┌─────────────────┐
│     coder       │ ◄── Implements hotfix
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     healer      │ ◄── Verifies fix, rollback if needed
└─────────────────┘
```

### Timeline Example

```
T+0:00  Alert received
T+0:05  Diagnostic agent analyzes:
        - Logs show database connection timeout
        - Recent deploy 30 min ago
        - Connection pool exhausted

T+0:10  Incident responder:
        - Severity: SEV1
        - Impact: 80% of users
        - Action: Rollback + investigate

T+0:15  Coder implements:
        - Increases connection pool size
        - Adds connection timeout handling
        - Prepares hotfix PR

T+0:20  Healer verifies:
        - Monitors error rate
        - Confirms fix is working
        - Documents incident
```

---

## Example 3: Codebase Migration

**Workflow:** `codebase-migration`
**Agents:** 6 (diagnostic → migration-specialist → coder → test-architect → reviewer → documentation-architect)

### Trigger

```bash
/flynn migrate our Express.js API to Hono with TypeScript
```

### Execution Flow

```
┌─────────────────┐
│   diagnostic    │ ◄── Analyzes current codebase
└────────┬────────┘
         │
         ▼
┌───────────────────────┐
│ migration-specialist  │ ◄── Creates migration plan
└────────┬──────────────┘
         │
         ▼
┌─────────────────┐
│     coder       │ ◄── Executes migration
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  test-architect │ ◄── Updates/creates tests
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    reviewer     │ ◄── Reviews changes
└────────┬────────┘
         │
         ▼
┌──────────────────────────┐
│ documentation-architect  │ ◄── Updates docs
└──────────────────────────┘
```

### Migration Checklist Generated

```markdown
## Express → Hono Migration

### Phase 1: Setup (diagnostic)
- [x] Inventory routes: 45 endpoints
- [x] Identify middleware: 8 custom
- [x] List dependencies: 23 packages

### Phase 2: Planning (migration-specialist)
- [x] Map Express patterns to Hono
- [x] Plan middleware conversion
- [x] Design testing strategy

### Phase 3: Implementation (coder)
- [x] Setup Hono project
- [x] Migrate routes
- [x] Convert middleware
- [x] Update dependencies

### Phase 4: Testing (test-architect)
- [x] Run existing tests
- [x] Add missing tests
- [x] Performance comparison

### Phase 5: Review (reviewer)
- [x] Code review
- [x] Security check
- [x] Performance audit

### Phase 6: Documentation (documentation-architect)
- [x] Update README
- [x] Update API docs
- [x] Create migration guide
```

---

## Example 4: ML Pipeline Setup

**Workflow:** `ml-pipeline`
**Agents:** 5 (data-engineer → ml-engineer → coder → test-architect → devops-engineer)

### Trigger

```bash
/flynn setup a sentiment analysis pipeline with training and inference
```

### Data Flow

```
┌──────────────────┐
│   data-engineer  │ ◄── Designs data pipeline
│                  │     - Data sources
│                  │     - ETL process
│                  │     - Feature store
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   ml-engineer    │ ◄── Designs ML architecture
│                  │     - Model selection
│                  │     - Training strategy
│                  │     - Metrics
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│      coder       │ ◄── Implements pipeline
│                  │     - Training script
│                  │     - Inference API
│                  │     - Model registry
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  test-architect  │ ◄── Creates ML tests
│                  │     - Data validation
│                  │     - Model tests
│                  │     - A/B testing
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  devops-engineer │ ◄── Deploys pipeline
│                  │     - CI/CD for ML
│                  │     - Model serving
│                  │     - Monitoring
└──────────────────┘
```

---

## Example 5: Security Hardening

**Workflow:** `security-hardening`
**Agents:** 4 (security → reviewer → diagnostic → coder)

### Trigger

```bash
/flynn harden our application security, we're preparing for a pentest
```

### Security Report Example

```markdown
## Security Hardening Report

### Critical Findings
1. **SQL Injection in /api/users** (security)
   - Location: src/routes/users.ts:45
   - Fix: Use parameterized queries

2. **Hardcoded API Key** (reviewer)
   - Location: src/config.ts:12
   - Fix: Move to environment variables

### High Priority
3. **Missing Rate Limiting** (diagnostic)
   - Endpoints: /api/auth/*
   - Fix: Implement rate limiter middleware

### Remediation (coder)
- [x] Fixed SQL injection
- [x] Moved secrets to env
- [x] Added rate limiting
- [x] Updated dependencies
```

---

## Usage Patterns

### Parallel Execution

Some workflows support parallel execution when agents are independent:

```
                    ┌─────────────────┐
                    │   diagnostic    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ security │  │ reviewer │  │performance│
        └────┬─────┘  └────┬─────┘  └────┬─────┘
              │              │              │
              └──────────────┼──────────────┘
                             ▼
                    ┌─────────────────┐
                    │     coder       │
                    └─────────────────┘
```

### Explicit Workflow Selection

```bash
# Use a specific workflow
/flynn --workflow=security-hardening review our codebase

# List available workflows
/flynn list-workflows
```

### Model Recommendations

Flynn uses a hybrid model approach:

| Agent Type | Recommended Model | Rationale |
|------------|-------------------|-----------|
| Architects (api, system, database) | opus | Deep architectural thinking |
| Analyzers (security, reviewer, diagnostic) | sonnet | Careful analysis |
| Executors (coder, devops) | sonnet/haiku | Straightforward implementation |

---

## Creating Custom Workflows

You can create custom workflows by combining agents:

```typescript
// In orchestrate.ts or via plugin
const customWorkflow = {
  id: "my-workflow",
  name: "My Custom Workflow",
  description: "A custom multi-agent workflow",
  agents: ["diagnostic", "coder", "reviewer"],
  triggers: ["my custom task", "do the thing"],
  parallel: false, // Sequential execution
};
```

---

## Troubleshooting

### Workflow Not Detected

If Flynn doesn't detect the right workflow:

```bash
# Be explicit about the workflow
/flynn --workflow=full-stack-feature implement user auth

# Or use specific trigger words
/flynn implement an end-to-end feature for user authentication
```

### Agent Context Issues

If an agent lacks context from a previous agent:

1. Ensure the workflow is sequential (not parallel)
2. Check that agent outputs are being passed correctly
3. Use `get-agent-context` to inspect what context is available

### Performance Optimization

For long workflows:

1. Use haiku for execution-heavy agents
2. Enable parallel execution where possible
3. Consider breaking into smaller workflows

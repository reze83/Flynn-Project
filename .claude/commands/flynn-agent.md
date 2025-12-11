---
description: Execute a specific Flynn agent directly
allowed-tools: mcp__flynn
model: sonnet
argument-hint: <agent-id> <task description>
---

## Direct Agent Execution

Execute a specific Flynn agent without workflow detection.

**Arguments:** $ARGUMENTS

### Step 1: Parse Arguments

The first word is the **agent ID**, the rest is the **task description**.

Example: `/flynn-agent security audit the authentication module`
- Agent ID: `security`
- Task: `audit the authentication module`

### Step 2: Get Agent Context

Call `get-agent-context` with the specific agent:

```
mcp__flynn__get-agent-context({
  task: "<task description>",
  agent: "<agent-id>"
})
```

### Step 3: Adopt the Agent Persona

When you receive the agent context:

1. **READ the instructions** - This is your new persona
2. **USE the recommended tools** - file-ops, git-ops, shell, etc.
3. **FOLLOW the workflow** - Execute steps in order
4. **RESPECT constraints** - Don't violate the rules
5. **FORMAT output** - Use the specified format

### Available Agents (26)

#### Core Agents
| Agent | Purpose | Model |
|-------|---------|-------|
| `coder` | Implement features | haiku |
| `diagnostic` | Debug issues | sonnet |
| `scaffolder` | Create projects | haiku |
| `installer` | Setup environments | haiku |
| `refactor` | Improve code | sonnet |
| `release` | Manage releases | haiku |
| `healer` | Recover from failures | sonnet |
| `data` | Data analysis | sonnet |
| `security` | Security audits | sonnet |
| `reviewer` | Code review | sonnet |
| `performance` | Performance optimization | sonnet |

#### Architecture Agents
| Agent | Purpose | Model |
|-------|---------|-------|
| `system-architect` | System design | opus |
| `database-architect` | Schema design | sonnet |
| `frontend-architect` | UI architecture | sonnet |
| `api-designer` | API design | sonnet |

#### Operations Agents
| Agent | Purpose | Model |
|-------|---------|-------|
| `devops-engineer` | CI/CD pipelines | haiku |
| `terraform-expert` | IaC with Terraform | sonnet |
| `kubernetes-operator` | K8s management | sonnet |
| `incident-responder` | Production incidents | sonnet |

#### Specialized Agents
| Agent | Purpose | Model |
|-------|---------|-------|
| `migration-specialist` | Codebase migrations | opus |
| `test-architect` | Test strategies | sonnet |
| `documentation-architect` | Technical docs | sonnet |
| `ml-engineer` | ML pipelines | sonnet |
| `data-engineer` | Data pipelines | sonnet |
| `mobile-developer` | Mobile apps | sonnet |
| `blockchain-developer` | Smart contracts | sonnet |

### Examples

```bash
# Security audit
/flynn-agent security audit the API endpoints

# Performance optimization
/flynn-agent performance analyze the database queries

# System architecture
/flynn-agent system-architect design a microservices architecture

# Database design
/flynn-agent database-architect optimize the user schema

# Code review
/flynn-agent reviewer review the recent PR changes
```

### Available Tools

- `mcp__flynn__file-ops` - Read, write, list files
- `mcp__flynn__git-ops` - Git status, diff, log, branch
- `mcp__flynn__shell` - Execute shell commands
- `mcp__flynn__analyze-project` - Analyze project structure
- `mcp__flynn__heal-error` - Error recovery

### Error Recovery

If an operation fails, use heal-error:

```
mcp__flynn__heal-error({
  error: "<error message>",
  context: "<what was being attempted>"
})
```

### Language Rules

- Respond in user's language
- Code and comments: always English
- Variable names: always English

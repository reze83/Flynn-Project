# ADR-003: Agent Architecture

## Status
Accepted

## Date
2025-12-08

## Context
Flynn uses a multi-agent architecture where specialized agents handle different task types. Key design decisions were needed for:

1. **Agent Discovery**: How agents are identified for tasks
2. **Context Loading**: How much context to load per request
3. **Workflow Orchestration**: How multi-agent workflows execute

## Decision

### Agent Context Structure
Each agent has a defined context with:
```typescript
interface AgentContext {
  id: string;
  role: string;
  description: string;
  instructions: string;
  capabilities: string[];
  triggers: string[];      // Keywords for routing
  tools: string[];
  workflow: string[];
  constraints: string[];
}
```

### Progressive Disclosure (Tier System)
Agents support tiered loading to minimize token usage:

- **Tier 1** (~100 tokens): Metadata only - id, role, description, triggers
- **Tier 2** (~2500 tokens): Full instructions and workflow
- **Tier 3** (~5000 tokens): Includes resources and examples

This allows quick routing decisions (Tier 1) while loading full context only when needed (Tier 2/3).

### Keyword-Based Routing
Task routing uses keyword matching against trigger words:
1. Message is lowercased
2. Each trigger checked against message
3. Agent with most matches wins
4. Confidence = matches / 3 (capped at 1.0)

### Workflow Templates
Pre-defined workflows combine agents for common tasks:
- `fix-bug`: diagnostic -> coder -> diagnostic
- `add-feature`: coder -> diagnostic
- `full-review`: reviewer -> security -> performance
- `release`: diagnostic -> release

## Consequences

### Positive
- Specialized agents improve task quality
- Progressive disclosure minimizes token costs
- Keyword routing requires no LLM calls
- Workflows encode best practices

### Negative
- Keyword matching can miss nuanced requests
- Agent handoffs may lose context
- More agents = more maintenance

### Future Considerations
- Semantic routing using embeddings
- Dynamic workflow generation
- Agent communication protocols

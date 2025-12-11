/**
 * Productivity Skills - Brainstorming, Planning, and Multi-Agent Coordination
 */

import type { Skill } from "../types.js";

export const brainstorming: Skill = {
  id: "brainstorming",
  name: "Brainstorming",
  description:
    "Transform rough ideas into detailed, validated designs before implementation through collaborative questioning and exploration.",
  category: "productivity",
  triggers: [
    "brainstorm",
    "idea",
    "design",
    "concept",
    "explore",
    "think",
    "creative",
    "approach",
    "solution",
    "options",
  ],
  tier1TokenEstimate: 50,
  tier2TokenEstimate: 2200,
  instructions: `# Brainstorming

Transform rough ideas into detailed, validated designs before implementation.

## When to Use
- Creative or design work requiring exploration
- Unclear requirements needing clarification
- Multiple valid approaches exist
- NOT for clear "mechanical" processes

## Phase 1: Understanding

### Question Strategy
- Ask ONE question per message
- Favor multiple-choice format when applicable
- Target: purpose, constraints, success metrics

### Example Questions
\`\`\`
"What's the primary goal?"
  A) Performance improvement
  B) New feature
  C) Refactoring
  D) Bug fix

"What constraints should I consider?"
  A) Must be backward compatible
  B) Performance critical
  C) Minimal dependencies
  D) Other (specify)
\`\`\`

## Phase 2: Exploration

### Approach Presentation
1. Present 2-3 different approaches
2. Lead with recommended option
3. Explain trade-offs for each
4. Maintain conversational tone

### Template
\`\`\`markdown
## Approaches

### Option A: [Name] (Recommended)
**How it works**: ...
**Pros**: ...
**Cons**: ...

### Option B: [Name]
**How it works**: ...
**Pros**: ...
**Cons**: ...

**My recommendation**: Option A because...
\`\`\`

## Phase 3: Design Presentation

### Structure
- Present in 200-300 word sections
- Request validation after each segment
- Cover: architecture, components, data flow, error handling, testing

### Incremental Validation
\`\`\`
"Here's the proposed architecture:
[200-300 words]

Does this align with your expectations?"
\`\`\`

## Key Principles

| Principle | Guidance |
|-----------|----------|
| Quantity | One question per message |
| Format | Multiple-choice preferred |
| YAGNI | Ruthlessly avoid unnecessary features |
| Validation | Incremental approval |
| Flexibility | Backtrack when misaligned |

## Post-Design Activities

1. **Document**: Save to \`docs/plans/YYYY-MM-DD-<topic>-design.md\`
2. **Version control**: Commit design document
3. **Transition**: Ask "Ready to set up for implementation?"

## Red Flags
- Jumping to implementation without validation
- Making assumptions without asking
- Presenting only one approach
- Large design sections without checkpoints`,
  resources: ["https://github.com/obra/superpowers/blob/main/skills/brainstorming/SKILL.md"],
};

export const writingPlans: Skill = {
  id: "writing-plans",
  name: "Writing Plans",
  description:
    "Create strategic documentation and implementation plans with clear structure and actionable steps.",
  category: "productivity",
  triggers: [
    "plan",
    "planning",
    "strategy",
    "roadmap",
    "document",
    "spec",
    "specification",
    "outline",
    "proposal",
  ],
  tier1TokenEstimate: 50,
  tier2TokenEstimate: 2000,
  instructions: `# Writing Plans

Create strategic documentation and implementation plans.

## Plan Structure

### 1. Executive Summary
\`\`\`markdown
# [Project/Feature Name] Plan

## Summary
Brief description of what we're building and why.

## Goals
- Primary goal
- Secondary goals
- Non-goals (explicitly out of scope)

## Success Metrics
- Metric 1: Target value
- Metric 2: Target value
\`\`\`

### 2. Technical Design
\`\`\`markdown
## Technical Approach

### Architecture
[Diagram or description of system architecture]

### Components
| Component | Responsibility | Dependencies |
|-----------|---------------|--------------|
| Name | What it does | What it needs |

### Data Flow
1. Step 1: Input received
2. Step 2: Processing
3. Step 3: Output generated

### API Design
\`\`\`typescript
interface MyAPI {
  method(param: Type): ReturnType;
}
\`\`\`
\`\`\`

### 3. Implementation Plan
\`\`\`markdown
## Implementation Phases

### Phase 1: Foundation
- [ ] Task 1
- [ ] Task 2
- [ ] Milestone: X is working

### Phase 2: Core Features
- [ ] Task 3
- [ ] Task 4
- [ ] Milestone: Y is complete

### Phase 3: Polish
- [ ] Task 5
- [ ] Task 6
- [ ] Milestone: Ready for release
\`\`\`

### 4. Risk Assessment
\`\`\`markdown
## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Description | High/Med/Low | High/Med/Low | How to prevent/handle |
\`\`\`

### 5. Open Questions
\`\`\`markdown
## Open Questions
- [ ] Question 1 - needs answer from X
- [ ] Question 2 - needs research
- [x] Question 3 - resolved: answer
\`\`\`

## File Naming Convention
\`\`\`
docs/plans/YYYY-MM-DD-<topic>-plan.md
docs/plans/2024-01-15-auth-redesign-plan.md
\`\`\`

## Plan Review Checklist
- [ ] Goals are clear and measurable
- [ ] Non-goals are explicitly stated
- [ ] Technical approach is validated
- [ ] Phases have clear milestones
- [ ] Risks are identified
- [ ] Open questions are tracked`,
  resources: ["https://github.com/obra/superpowers/blob/main/skills/writing-plans/SKILL.md"],
};

export const executingPlans: Skill = {
  id: "executing-plans",
  name: "Executing Plans",
  description:
    "Implement and run strategic plans with systematic progress tracking and milestone validation.",
  category: "productivity",
  triggers: [
    "execute",
    "implement",
    "build",
    "create",
    "develop",
    "start",
    "begin",
    "proceed",
    "milestone",
  ],
  tier1TokenEstimate: 50,
  tier2TokenEstimate: 1800,
  instructions: `# Executing Plans

Implement strategic plans with systematic progress tracking.

## Execution Workflow

### 1. Plan Review
Before starting:
- Read the entire plan
- Identify dependencies between tasks
- Note any blockers or prerequisites
- Confirm understanding with stakeholder

### 2. Task Prioritization
\`\`\`
Priority Matrix:

        Urgent
           │
    2      │      1
 Important │ Important
 Not Urgent│ Urgent
───────────┼───────────
    4      │      3
Not Important│Not Important
 Not Urgent│ Urgent
           │
\`\`\`

### 3. Progress Tracking

#### Task States
| State | Meaning |
|-------|---------|
| ⏳ Pending | Not started |
| 🔄 In Progress | Currently working |
| ⏸️ Blocked | Waiting on dependency |
| ✅ Complete | Finished and verified |
| ❌ Cancelled | No longer needed |

#### Status Updates
\`\`\`markdown
## Progress Update - [Date]

### Completed
- ✅ Task 1 - notes on completion
- ✅ Task 2

### In Progress
- 🔄 Task 3 - 50% complete, ETA: tomorrow

### Blocked
- ⏸️ Task 4 - waiting on API access

### Next Up
- ⏳ Task 5
- ⏳ Task 6
\`\`\`

### 4. Milestone Validation

At each milestone:
1. **Verify**: All tasks in phase complete
2. **Test**: Functionality works as expected
3. **Document**: Update any changed decisions
4. **Review**: Get stakeholder approval
5. **Proceed**: Move to next phase

### 5. Handling Changes

When plan needs adjustment:
1. Document the change request
2. Assess impact on timeline/scope
3. Get approval before implementing
4. Update the plan document
5. Communicate to stakeholders

## Execution Checklist
- [ ] Plan reviewed and understood
- [ ] Dependencies identified
- [ ] First task selected
- [ ] Progress tracking set up
- [ ] Stakeholder communication scheduled`,
  resources: ["https://github.com/obra/superpowers/blob/main/skills/executing-plans/SKILL.md"],
};

export const dispatchingParallelAgents: Skill = {
  id: "dispatching-parallel-agents",
  name: "Dispatching Parallel Agents",
  description:
    "Coordinate multiple simultaneous agents for complex tasks requiring parallel execution.",
  category: "productivity",
  triggers: [
    "parallel",
    "concurrent",
    "multi-agent",
    "subagent",
    "task tool",
    "spawn",
    "delegate",
    "distribute",
  ],
  tier1TokenEstimate: 50,
  tier2TokenEstimate: 2400,
  instructions: `# Dispatching Parallel Agents

Coordinate multiple simultaneous agents for complex tasks.

## When to Use Parallel Agents

### Good Candidates
- Independent research tasks
- Multiple file searches
- Parallel test runs
- Concurrent API calls
- Multi-area code exploration

### Bad Candidates
- Sequential dependencies
- Single file operations
- Simple lookups
- Tasks requiring shared state

## Dispatch Patterns

### Pattern 1: Fan-Out / Fan-In
\`\`\`
        ┌─ Agent 1 ─┐
        │           │
Main ───┼─ Agent 2 ─┼─── Merge Results
        │           │
        └─ Agent 3 ─┘
\`\`\`

Use when: Multiple independent subtasks, results need combining

### Pattern 2: Pipeline
\`\`\`
Agent 1 ──► Agent 2 ──► Agent 3 ──► Result
\`\`\`

Use when: Sequential processing, each stage transforms data

### Pattern 3: Competitive
\`\`\`
        ┌─ Agent 1 ─┐
        │           │
Main ───┤           ├─── First/Best Result
        │           │
        └─ Agent 2 ─┘
\`\`\`

Use when: Multiple approaches, take best/fastest result

## Implementation

### Using Task Tool
\`\`\`typescript
// Launch parallel agents in single message
// Each agent gets specific focus

Agent 1: "Search for authentication patterns in /src/auth"
Agent 2: "Search for middleware usage in /src/middleware"
Agent 3: "Search for route definitions in /src/routes"
\`\`\`

### Agent Prompt Template
\`\`\`markdown
## Task
[Specific, focused objective]

## Context
[Background information needed]

## Constraints
- Time/scope limits
- What NOT to do

## Expected Output
[Exact format of results to return]
\`\`\`

## Coordination Strategies

### Result Aggregation
\`\`\`typescript
// Merge results from multiple agents
const results = await Promise.all([
  agent1.search(),
  agent2.search(),
  agent3.search(),
]);

const merged = results.flat().filter(unique);
\`\`\`

### Error Handling
\`\`\`typescript
// Handle partial failures
const results = await Promise.allSettled([
  agent1.task(),
  agent2.task(),
]);

const successful = results
  .filter(r => r.status === 'fulfilled')
  .map(r => r.value);
\`\`\`

## Best Practices

| Practice | Rationale |
|----------|-----------|
| Clear scope per agent | Prevents overlap/conflicts |
| Explicit output format | Enables result merging |
| Timeout handling | Prevents hanging |
| Partial result acceptance | Graceful degradation |
| Result deduplication | Avoid redundancy |

## Common Pitfalls
- Launching too many agents (diminishing returns)
- Overlapping search areas (wasted effort)
- Missing result combination logic
- No timeout handling
- Ignoring partial failures`,
  resources: [
    "https://github.com/obra/superpowers/blob/main/skills/dispatching-parallel-agents/SKILL.md",
  ],
};

export const PRODUCTIVITY_SKILLS: Record<string, Skill> = {
  brainstorming: brainstorming,
  "writing-plans": writingPlans,
  "executing-plans": executingPlans,
  "dispatching-parallel-agents": dispatchingParallelAgents,
};

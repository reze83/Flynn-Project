# Refactoring Loop System

Automated continuous improvement system for Flynn's Agent, MCP Tool, and Workflow architecture.

## Overview

The Refactoring Loop provides automated analysis and optimization of:
- **Agent-to-MCP-Tool Mappings** - Ensures agents have appropriate tool access
- **Tool Categorization** - Validates pattern-based categorization is effective
- **Workflow Configuration** - Checks workflow consistency
- **System Health Metrics** - Tracks overall system quality

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Refactoring Loop                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │   Analyze    │─────▶│   Metrics    │                   │
│  └──────────────┘      └──────────────┘                   │
│         │                      │                           │
│         ▼                      ▼                           │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │  Find Issues │      │    Health    │                   │
│  └──────────────┘      │   Scoring    │                   │
│         │              └──────────────┘                   │
│         ▼                      │                           │
│  ┌──────────────┐             ▼                           │
│  │  Recommend   │      ┌──────────────┐                   │
│  │    Fixes     │◀─────│  Converge?   │                   │
│  └──────────────┘      └──────────────┘                   │
│         │                      │                           │
│         └──────────────────────┘                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Usage

### Basic Usage

```typescript
import { RefactoringLoop } from "@flynn/tools";

const loop = new RefactoringLoop();
const result = await loop.run({
  maxIterations: 3,
  autoFix: false,
  minSeverity: "medium",
});

console.log(`Health: ${result.finalMetrics.overallHealth}%`);
console.log(`Issues: ${result.iterations[0].issues.length}`);
```

### As a Tool

```typescript
import { refactoringLoopTool } from "@flynn/tools";

// Use with Mastra
const result = await refactoringLoopTool.execute({
  maxIterations: 5,
  autoFix: false,
  categories: ["tool-categorization", "agent-coverage"],
  minSeverity: "high",
});
```

### CLI Usage

```bash
# Run from Flynn CLI
pnpm flynn refactoring-loop --iterations 3 --severity medium

# Or via Node
node -e "
const { RefactoringLoop } = require('@flynn/tools');
new RefactoringLoop().run({ maxIterations: 3 }).then(console.log);
"
```

## Configuration

### Input Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `maxIterations` | number | 3 | Maximum loop iterations (1-10) |
| `autoFix` | boolean | false | Automatically apply fixes (not yet implemented) |
| `minSeverity` | string | "medium" | Minimum severity to report ("low", "medium", "high", "critical") |
| `categories` | string[] | all | Specific categories to analyze |

### Issue Categories

1. **tool-mapping** - Problems with agent-to-tool mappings
2. **tool-categorization** - Uncategorized or miscategorized tools
3. **workflow-optimization** - Workflow configuration issues
4. **agent-coverage** - Agents missing recommended tools
5. **pattern-enhancement** - Regex pattern effectiveness

### Severity Levels

- **critical** - System-breaking issues requiring immediate attention
- **high** - Major problems significantly impacting functionality
- **medium** - Moderate issues that should be addressed
- **low** - Minor improvements or optimizations

## Metrics

### System Health Score (0-100)

Calculated from:
- **Pattern Coverage** (0-100): Percentage of tools properly categorized
- **Uncategorized Penalty**: -2 points per uncategorized tool (max -30)
- **Incomplete Agent Penalty**: -5 points per agent without tools (max -20)

Formula:
```
health = max(0, patternCoverage - uncategorizedPenalty - incompletePenalty)
```

### Health Ranges

- **90-100%**: Excellent - System is well-maintained
- **70-89%**: Good - Minor improvements recommended
- **50-69%**: Moderate - Optimization needed
- **0-49%**: Low - Significant refactoring required

## Analysis Process

### 1. Tool Categorization Check

Identifies uncategorized tools and suggests pattern improvements:

```typescript
// Example issue
{
  category: "tool-categorization",
  severity: "high",
  description: "5 tools match pattern 'memory' but are uncategorized",
  suggestion: "Add regex pattern /memory/i to CATEGORY_PATTERNS",
  affectedTools: ["add_memory", "write_memory", "delete_memory", ...]
}
```

### 2. Agent Coverage Check

Ensures agents have appropriate tool access:

```typescript
// Example issue
{
  category: "agent-coverage",
  severity: "high",
  description: "Agent 'reviewer' has no MCP tool mappings",
  suggestion: "Add tools to AGENT_MCP_TOOL_MAPPINGS or categories",
  affectedAgents: ["reviewer"]
}
```

### 3. Pattern Effectiveness Check

Validates regex patterns are working correctly:

```typescript
// Example issue
{
  category: "pattern-enhancement",
  severity: "low",
  description: "Category 'custom-tools' has only 1 tool",
  suggestion: "Consider if category is too specific"
}
```

### 4. Workflow Consistency Check

Verifies workflow configurations (future enhancement).

## Output Structure

```typescript
{
  iterations: [
    {
      iteration: 1,
      timestamp: "2025-12-11T...",
      metrics: {
        totalAgents: 30,
        totalMcpTools: 124,
        uncategorizedTools: 12,
        agentsWithIncompleteTools: 2,
        categoryPatternCoverage: 90.3,
        overallHealth: 75
      },
      issues: [...],
      fixesApplied: 0,
      recommendations: [
        "📋 Categorize 12 uncategorized tools",
        "🤖 Configure MCP tools for 2 agents"
      ],
      convergenceStatus: "improving"
    }
  ],
  finalMetrics: { ... },
  summary: "Refactoring loop completed 2 iteration(s)...",
  success: true
}
```

## Convergence

The loop stops when:
1. Maximum iterations reached
2. System becomes stable (no health changes between iterations)
3. No more issues found

Convergence status tracked per iteration:
- **improving** - Health score increased
- **stable** - Health score unchanged
- **degrading** - Health score decreased

## Best Practices

### 1. Regular Execution

Run the refactoring loop regularly to maintain system health:

```bash
# Weekly cron job
0 0 * * 0 pnpm flynn refactoring-loop --iterations 5 > refactoring-report.log
```

### 2. CI/CD Integration

Add to CI pipeline to prevent regressions:

```yaml
# .github/workflows/health-check.yml
- name: Run Refactoring Loop
  run: |
    node -e "
    const { RefactoringLoop } = require('@flynn/tools');
    new RefactoringLoop().run({ minSeverity: 'high' }).then(result => {
      if (result.finalMetrics.overallHealth < 70) {
        console.error('Health score too low:', result.finalMetrics.overallHealth);
        process.exit(1);
      }
    });
    "
```

### 3. Monitoring

Track metrics over time:

```typescript
import { RefactoringLoop } from "@flynn/tools";
import { writeFileSync } from "fs";

const loop = new RefactoringLoop();
const result = await loop.run({ maxIterations: 3 });

// Log to analytics
writeFileSync(
  `metrics-${Date.now()}.json`,
  JSON.stringify(result.finalMetrics, null, 2)
);
```

### 4. Incremental Fixes

Address high-severity issues first:

```typescript
const result = await loop.run({ 
  minSeverity: "critical",
  categories: ["tool-mapping", "agent-coverage"]
});

// Fix critical issues manually
for (const issue of result.iterations[0].issues) {
  console.log(`TODO: ${issue.suggestion}`);
}
```

## Examples

### Example 1: Find Uncategorized Tools

```typescript
const loop = new RefactoringLoop();
const result = await loop.run({
  maxIterations: 1,
  categories: ["tool-categorization"],
  minSeverity: "low",
});

// Group issues by pattern
const patternGroups = {};
for (const issue of result.iterations[0].issues) {
  if (issue.affectedTools) {
    const pattern = issue.description.match(/"(.+?)"/)?.[1];
    if (pattern) {
      patternGroups[pattern] = issue.affectedTools;
    }
  }
}

console.log("Tools needing categorization:", patternGroups);
```

### Example 2: Check Agent Coverage

```typescript
const loop = new RefactoringLoop();
const result = await loop.run({
  maxIterations: 1,
  categories: ["agent-coverage"],
  minSeverity: "medium",
});

// Get agents needing configuration
const needsConfig = result.iterations[0].issues
  .filter(i => i.severity === "high")
  .map(i => i.affectedAgents)
  .flat();

console.log("Agents needing tool configuration:", [...new Set(needsConfig)]);
```

### Example 3: Health Dashboard

```typescript
async function healthDashboard() {
  const loop = new RefactoringLoop();
  const result = await loop.run({ maxIterations: 1 });
  const m = result.finalMetrics;

  console.log(`
╔════════════════════════════════════════╗
║        Flynn System Health             ║
╠════════════════════════════════════════╣
║ Overall Health:      ${m.overallHealth}%            ║
║ Total Agents:        ${m.totalAgents}              ║
║ Total MCP Tools:     ${m.totalMcpTools}             ║
║ Uncategorized:       ${m.uncategorizedTools}               ║
║ Pattern Coverage:    ${m.categoryPatternCoverage.toFixed(1)}%         ║
╚════════════════════════════════════════╝
  `);
}

healthDashboard();
```

## Troubleshooting

### Issue: Low Health Score

**Cause**: Multiple uncategorized tools or missing agent configurations

**Solution**:
```typescript
// 1. Find the specific issues
const result = await loop.run({ minSeverity: "high" });
console.log(result.iterations[0].issues);

// 2. Apply suggested fixes from recommendations
console.log(result.iterations[0].recommendations);
```

### Issue: Loop Not Converging

**Cause**: Issues being re-detected each iteration

**Solution**:
```typescript
// Track issue changes across iterations
const result = await loop.run({ maxIterations: 5 });
for (let i = 0; i < result.iterations.length; i++) {
  console.log(`Iteration ${i + 1}:`, result.iterations[i].issues.length, "issues");
}
```

### Issue: Too Many False Positives

**Cause**: Overly strict pattern matching or incorrect categorization logic

**Solution**:
```typescript
// Filter by severity
const result = await loop.run({ 
  minSeverity: "high",  // Only show important issues
});

// Or filter by category
const result = await loop.run({
  categories: ["tool-categorization"],  // Focus on one area
});
```

## Future Enhancements

- [ ] **Auto-fix Implementation** - Automatically apply suggested fixes
- [ ] **Workflow Validation** - Check workflow agent sequences
- [ ] **Performance Metrics** - Track execution time trends
- [ ] **Historical Tracking** - Compare metrics over time
- [ ] **Custom Rules** - User-defined quality checks
- [ ] **Integration Tests** - Validate fixes don't break functionality

## Related Documentation

- [Agent Architecture](./AGENTS.md)
- [MCP Server Reference](./MCP-SERVER-REFERENCE.md)
- [Workflow System](./WORKFLOWS.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

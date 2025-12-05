---
description: Flynn AI Orchestrator - Single entry point for all development tasks
allowed-tools: mcp__flynn
model: opus
argument-hint: <task description>
---

Execute the Flynn orchestrator for the given task.

Task: $ARGUMENTS

The Flynn orchestrator will:
1. Analyze your request
2. Route to the appropriate specialized agent
3. Execute the task with necessary tools
4. Return results or ask for clarification

Available capabilities:
- install/setup: Install dependencies and configure environment
- diagnose/debug: Diagnose and debug issues
- create/scaffold: Generate new projects or components
- implement/code: Write and modify code
- refactor/improve: Improve code quality
- release/publish: Prepare releases
- data/analyze: Data analysis tasks

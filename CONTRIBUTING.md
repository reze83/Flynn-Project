# Contributing to Flynn

Thank you for your interest in contributing to Flynn! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- Python 3.11+ (optional, for data/ML tools)
- Git

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/reze83/Flynn-Project.git
cd Flynn-Project

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests to verify setup
pnpm test
```

### Project Structure

```
flynn/
├── apps/
│   ├── server/          # MCP server entry point
│   ├── cli/             # CLI for analytics & health
│   └── dashboard/       # Static analytics dashboard
│
├── packages/
│   ├── core/            # Logging, policy, paths, types
│   ├── tools/           # All MCP tools (15+)
│   ├── agents/          # Agent contexts & RAG utilities
│   ├── analytics/       # Usage tracking (LibSQL)
│   ├── plugins/         # Plugin framework
│   ├── plugins-core/    # Core plugins
│   ├── bootstrap/       # Environment detection
│   └── python/          # Python MCP tools
│
├── config/              # Policy profiles
└── docs/                # Documentation
```

## Development Workflow

### Running the Development Server

```bash
# Build and start the MCP server
pnpm --filter @flynn/server build && pnpm --filter @flynn/server start

# Or use watch mode for development
pnpm --filter @flynn/server dev
```

### Code Quality

Before submitting changes:

```bash
# Lint code
pnpm lint

# Fix lint issues automatically
pnpm lint:fix

# Type check
pnpm typecheck

# Run all tests
pnpm test

# Run specific package tests
pnpm --filter @flynn/tools test
```

### Testing

Flynn uses Vitest for testing. Tests are located alongside source code in `__tests__` directories.

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Contributing Guidelines

### Commit Messages

Follow conventional commit format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding/updating tests
- `chore`: Build process, dependencies, etc.

**Examples:**
```
feat(tools): add documentation-suite workflow
fix(shell): block command substitution patterns
docs: update CONTRIBUTING guide
perf(router): add trigger index for O(1) lookups
```

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following the code style
3. **Add tests** for any new functionality
4. **Update documentation** if needed
5. **Run the test suite** to ensure nothing is broken
6. **Submit a pull request** with a clear description

### Pull Request Template

```markdown
## Summary
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] New tests added (if applicable)

## Checklist
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Documentation updated
```

## Adding New Features

### Adding a New Agent

1. Create the agent context in the appropriate file under `packages/tools/src/agents/`:

```typescript
// packages/tools/src/agents/domain-agents.ts
export const myNewAgent: AgentContext = {
  id: "my-agent",
  name: "Flynn My Agent",
  description: "Does something useful",
  instructions: `You are the Flynn My Agent...`,
  tools: ["file-ops", "shell"],
  workflow: ["Step 1", "Step 2", "Step 3"],
  constraints: ["Constraint 1", "Constraint 2"],
  outputFormat: "Expected output format",
  triggers: ["keyword1", "keyword2"],
  capabilities: ["Capability 1", "Capability 2"],
  recommendedModel: "sonnet",
  modelRationale: "Why this model",
  tier1TokenEstimate: 140,
  tier2TokenEstimate: 500,
};
```

2. Export the agent in the agents index file
3. Add tests for the agent routing
4. Update documentation

### Adding a New Workflow

1. Add the workflow to `packages/tools/src/orchestrate.ts`:

```typescript
const WORKFLOW_TEMPLATES = {
  // ...existing workflows
  "my-workflow": ["agent1", "agent2", "agent3"],
};

const TEMPLATE_TRIGGERS = {
  // ...existing triggers
  "my-workflow": ["trigger1", "trigger2"],
};
```

2. Add the workflow definition to `packages/tools/src/list-workflows.ts`:

```typescript
export const WORKFLOW_DEFINITIONS = {
  // ...existing definitions
  "my-workflow": {
    name: "My Workflow",
    description: "What it does",
    agents: ["agent1", "agent2", "agent3"],
    triggers: ["trigger1", "trigger2"],
    useCase: "When to use this workflow",
  },
};
```

3. Add tests and update documentation

### Adding a New Tool

1. Create the tool in `packages/tools/src/`:

```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const inputSchema = z.object({
  // Define input parameters
});

const outputSchema = z.object({
  // Define output structure
});

export const myTool = createTool({
  id: "my-tool",
  description: "What the tool does",
  inputSchema,
  outputSchema,
  execute: async (input) => {
    // Implementation
  },
});
```

2. Export the tool in `packages/tools/src/index.ts`
3. Register the tool in the MCP server
4. Add tests and documentation

## Security Guidelines

### Security-First Development

- **Never bypass security checks** — The `allowUnsafe` pattern is deprecated
- **Validate all inputs** — Use Zod schemas for type-safe validation
- **Block dangerous patterns** — See `shell.ts` for blocked command patterns
- **Prevent path traversal** — Always validate paths are within allowed directories
- **Safe JSON parsing** — Use `safeJsonParse` to prevent prototype pollution

### Reporting Security Issues

If you discover a security vulnerability, please:

1. **Do not** open a public issue
2. Email security concerns privately
3. Include detailed reproduction steps
4. Allow time for us to address the issue

## Code Style

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Prefer `const` over `let`
- Use explicit types for function parameters and return values
- Use `interface` for object shapes, `type` for unions/intersections

### Formatting

- Biome is used for linting and formatting
- Run `pnpm lint:fix` to auto-fix issues
- 2-space indentation
- No semicolons (configured in Biome)
- Single quotes for strings

### Documentation

- Add JSDoc comments for public APIs
- Update README when adding features
- Keep ADRs for significant architectural decisions

## Getting Help

- **Issues:** Open an issue for bugs or feature requests
- **Discussions:** Use GitHub Discussions for questions
- **Documentation:** Check `/docs` for detailed guides

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

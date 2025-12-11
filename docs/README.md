# Flynn Documentation

Welcome to the Flynn AI Agent Orchestrator documentation! This guide will help you get started and make the most of Flynn's capabilities.

## 📚 Table of Contents

### Getting Started

- **[Installation & Setup](../README.md#flight-plan)** - Quick installation guide
- **[Quick Start Guide](QUICKSTART.md)** - 5-minute developer onboarding
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions

### Core Concepts

- **[Architecture](ARCHITECTURE.md)** - System design and data flow
- **[Agents](AGENTS.md)** - All 27 specialized agents with capabilities
- **[Workflows](WORKFLOWS.md)** - All 23 multi-agent workflows
- **[Tools](TOOLS.md)** - All 18 MCP tools with schemas
- **[Skills](SKILLS.md)** - All 17 skills with progressive disclosure

### Setup & Integration

- **[MCP Setup Guide](MCP-SETUP-GUIDE.md)** - Configure Claude Code with Flynn
- **[MCP Server Reference](MCP-SERVER-REFERENCE.md)** - Technical reference for MCP integration
- **[MCP Tool Configuration](MCP-TOOL-CONFIGURATION.md)** - Tool configuration and permissions
- **[Agent Tools Integration](AGENT_TOOLS_INTEGRATION.md)** - How agents use tools
- **[Puppeteer Setup](PUPPETEER_SETUP.md)** - Browser automation setup (Linux/WSL)

### Advanced Topics

- **[Multi-Agent Examples](MULTI-AGENT-EXAMPLES.md)** - Complex workflow patterns
- **[Refactoring Loop](REFACTORING-LOOP.md)** - Systematic code improvement process

### Testing & Quality

- **[Agent Test Report](AGENT_TEST_REPORT.md)** - Test coverage and results

### Architecture Decision Records (ADRs)

Learn about key architectural decisions and their rationale:

- **[001: Security Hardening](decisions/001-security-hardening.md)** - Security policy implementation
- **[002: Performance Optimizations](decisions/002-performance-optimizations.md)** - Performance improvements
- **[003: Agent Architecture](decisions/003-agent-architecture.md)** - Agent system design

## 🎯 Quick Navigation by Use Case

### I want to...

**...get started quickly**
→ [Quick Start Guide](QUICKSTART.md) → [Troubleshooting](TROUBLESHOOTING.md)

**...understand how Flynn works**
→ [Architecture](ARCHITECTURE.md) → [Agents](AGENTS.md) → [Workflows](WORKFLOWS.md)

**...configure Claude Code**
→ [MCP Setup Guide](MCP-SETUP-GUIDE.md) → [MCP Server Reference](MCP-SERVER-REFERENCE.md)

**...use specific features**
→ [Tools](TOOLS.md) → [Skills](SKILLS.md) → [Multi-Agent Examples](MULTI-AGENT-EXAMPLES.md)

**...solve problems**
→ [Troubleshooting](TROUBLESHOOTING.md) → [Agent Test Report](AGENT_TEST_REPORT.md)

**...contribute**
→ [Contributing Guide](../CONTRIBUTING.md) → [Architecture Decision Records](decisions/)

## 📖 Documentation Standards

This documentation follows the [Standard README](https://github.com/RichardLitt/standard-readme) specification for consistency and usability.

### Document Conventions

- **Commands** are shown in `code blocks`
- **File paths** are relative to project root
- **Code examples** include language hints
- **Links** use absolute paths from project root

### Keeping Documentation Updated

When making changes to Flynn:

1. Update relevant documentation in `docs/`
2. Update main `README.md` if user-facing changes
3. Add ADR in `docs/decisions/` for architectural changes
4. Update `CHANGELOG.md` for version changes

## 🤝 Contributing to Documentation

Found an error or want to improve the docs?

1. Check if issue already exists in [GitHub Issues](https://github.com/reze83/Flynn-Project/issues)
2. Create a PR with your improvements
3. Follow existing document structure and style
4. Test all code examples

See [CONTRIBUTING.md](../CONTRIBUTING.md) for full contribution guidelines.

## 📄 License

All documentation is licensed under [MIT License](../LICENSE).

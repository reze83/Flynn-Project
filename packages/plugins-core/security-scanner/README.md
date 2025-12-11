# @flynn-plugin/security-scanner

A Flynn plugin for automated security scanning and vulnerability detection.

## Features

- **Security Scanner Agent**: Automated vulnerability scanning
- **OWASP Top 10 Skill**: Knowledge of common security vulnerabilities
- **Dependency Audit Skill**: Techniques for auditing dependencies
- **Security Scan Workflow**: Full codebase security scan
- **Vulnerability Fix Workflow**: Fix identified issues

## Installation

```bash
# Install as a project plugin
pnpm add @flynn-plugin/security-scanner

# Or copy to ~/.flynn/plugins/security-scanner
```

## Usage

### Via Flynn Commands

```bash
# Run a security scan
/flynn security scan

# Fix vulnerabilities
/flynn fix vulnerabilities

# Audit dependencies
/flynn audit security
```

### Via MCP Tools

```typescript
// Get the security scanner agent context
const context = await mcp__flynn__getAgentContext({
  agentId: "security-scanner:security-scanner"
});

// List available skills
const skills = await mcp__flynn__listSkills();
// Includes: security-scanner:owasp-top-10, security-scanner:dependency-audit
```

## Provided Extensions

### Agent: security-scanner

Automated security vulnerability scanner that:
- Analyzes code for security issues
- Checks dependencies for CVEs
- Identifies OWASP Top 10 vulnerabilities
- Suggests security improvements

### Skill: owasp-top-10

Knowledge of OWASP Top 10 2021:
- A01: Broken Access Control
- A02: Cryptographic Failures
- A03: Injection
- A04: Insecure Design
- A05: Security Misconfiguration
- A06: Vulnerable Components
- A07: Authentication Failures
- A08: Software and Data Integrity
- A09: Security Logging
- A10: SSRF

### Skill: dependency-audit

Techniques for auditing dependencies across:
- NPM/Node.js (npm audit)
- Python (pip-audit, safety)
- Go (govulncheck)
- Rust (cargo audit)
- General tools (Snyk, OWASP Dependency-Check)

### Workflow: security-scan

Full security scan workflow:
1. security-scanner - Scan for vulnerabilities
2. diagnostic - Analyze findings

### Workflow: vulnerability-fix

Fix vulnerabilities workflow:
1. security-scanner - Identify issues
2. coder - Implement fixes
3. diagnostic - Verify fixes

## Development

```bash
# Build
pnpm build

# Clean
pnpm clean
```

## License

MIT

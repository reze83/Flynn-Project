# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

1. **Do NOT** open a public GitHub issue for security vulnerabilities
2. Email security concerns to: **security@flynn-project.dev** (or open a private security advisory on GitHub)
3. Include as much detail as possible:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: Within 48 hours of your report
- **Initial Assessment**: Within 5 business days
- **Resolution Timeline**: Depends on severity
  - Critical: 24-72 hours
  - High: 1-2 weeks
  - Medium: 2-4 weeks
  - Low: Next release cycle

### Security Best Practices for Users

#### API Keys and Secrets

- **Never commit** `.env.mcp` or any file containing API keys
- Use `.env.mcp.template` as a reference for required variables
- Store secrets in environment variables or secure vaults
- Rotate API keys regularly

#### MCP Server Security

- Flynn supports multiple security profiles:
  ```bash
  export FLYNN_POLICY_PROFILE=strict   # default | strict | airgapped
  ```
- **default**: Standard protections
- **strict**: Disables network-based tools
- **airgapped**: Maximum isolation (file operations only)

#### Shell Command Safety

- Flynn validates all shell commands against a security policy
- Dangerous patterns are blocked by default
- Review the command whitelist in `packages/tools/src/shell.ts`

### Security Features

Flynn implements several security measures:

1. **Input Validation**: All inputs are sanitized and validated
2. **Path Traversal Protection**: File paths are validated against base directories
3. **Command Injection Prevention**: Shell commands are parsed and validated
4. **Policy Enforcement**: Configurable security profiles
5. **Audit Logging**: Tool invocations are logged for review

### Dependency Security

- We regularly run `pnpm audit` to check for vulnerabilities
- Dependencies are updated promptly when security issues are discovered
- CI/CD includes automated security scanning

### Acknowledgments

We appreciate responsible disclosure and will acknowledge security researchers who help improve Flynn's security (with their permission).

---

Thank you for helping keep Flynn and its users safe!

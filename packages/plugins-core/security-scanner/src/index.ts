/**
 * Security Scanner Plugin
 *
 * Provides automated security scanning and vulnerability detection.
 */

import type { FlynnPlugin, PluginContext } from "@flynn/plugins";

/**
 * Security Scanner Agent Definition
 */
const securityScannerAgent = {
  id: "security-scanner",
  name: "Security Scanner",
  description: "Automated security vulnerability scanner",
  instructions: `You are a security scanning agent. Your role is to:
1. Analyze code for security vulnerabilities
2. Check dependencies for known CVEs
3. Identify OWASP Top 10 issues
4. Suggest security improvements

Use available tools to scan the codebase and report findings.`,
  tools: ["shell", "file-ops", "grep"],
  workflow: [
    "Scan package dependencies for vulnerabilities",
    "Check for hardcoded secrets",
    "Analyze code for injection vulnerabilities",
    "Review authentication/authorization patterns",
    "Generate security report",
  ],
  constraints: [
    "Never expose sensitive data in reports",
    "Prioritize critical vulnerabilities",
    "Provide actionable remediation steps",
  ],
  outputFormat: `## Security Scan Report

### Summary
- Critical: X
- High: X
- Medium: X
- Low: X

### Findings
[Detailed findings with remediation]`,
  triggers: ["security scan", "vulnerability check", "audit security", "find vulnerabilities"],
  recommendedModel: "sonnet" as const,
  modelRationale: "Requires careful analysis but not deep architectural thinking",
};

/**
 * OWASP Top 10 Skill Definition
 */
const owaspSkill = {
  id: "owasp-top-10",
  name: "OWASP Top 10",
  description: "Knowledge of OWASP Top 10 security vulnerabilities",
  instructions: `# OWASP Top 10 2021

## A01:2021 - Broken Access Control
- Enforce least privilege
- Deny by default
- Validate server-side

## A02:2021 - Cryptographic Failures
- Encrypt sensitive data
- Use strong algorithms
- Manage keys securely

## A03:2021 - Injection
- Use parameterized queries
- Validate input
- Escape output

## A04:2021 - Insecure Design
- Use threat modeling
- Secure design patterns
- Reference architecture

## A05:2021 - Security Misconfiguration
- Hardening procedures
- Remove defaults
- Update regularly

## A06:2021 - Vulnerable Components
- Track dependencies
- Monitor CVEs
- Update promptly

## A07:2021 - Authentication Failures
- MFA implementation
- Password policies
- Session management

## A08:2021 - Software and Data Integrity
- Verify integrity
- Secure CI/CD
- Code signing

## A09:2021 - Security Logging
- Log security events
- Monitor anomalies
- Incident response

## A10:2021 - SSRF
- Validate URLs
- Allowlist destinations
- Network segmentation`,
  triggers: ["owasp", "security best practices", "vulnerability types"],
};

/**
 * Dependency Audit Skill Definition
 */
const dependencyAuditSkill = {
  id: "dependency-audit",
  name: "Dependency Audit",
  description: "Techniques for auditing project dependencies",
  instructions: `# Dependency Audit Techniques

## NPM/Node.js
\`\`\`bash
npm audit
npm audit --json
npm outdated
\`\`\`

## Python
\`\`\`bash
pip-audit
safety check
pip list --outdated
\`\`\`

## Go
\`\`\`bash
go list -m all
govulncheck ./...
\`\`\`

## Rust
\`\`\`bash
cargo audit
cargo outdated
\`\`\`

## General Tools
- Snyk: snyk test
- OWASP Dependency-Check
- GitHub Dependabot
- Renovate Bot

## Best Practices
1. Run audits in CI/CD
2. Set severity thresholds
3. Auto-update non-breaking
4. Review breaking updates
5. Pin production versions`,
  triggers: ["dependency audit", "check dependencies", "cve scan"],
};

/**
 * Security Scan Workflow Definition
 */
const securityScanWorkflow = {
  id: "security-scan",
  name: "Security Scan",
  description: "Full security scan of the codebase",
  agents: ["security-scanner", "diagnostic"],
  triggers: ["run security scan", "security audit", "pentest"],
};

/**
 * Vulnerability Fix Workflow Definition
 */
const vulnerabilityFixWorkflow = {
  id: "vulnerability-fix",
  name: "Vulnerability Fix",
  description: "Fix identified vulnerabilities",
  agents: ["security-scanner", "coder", "diagnostic"],
  triggers: ["fix vulnerability", "patch security", "remediate"],
};

/**
 * Security Scanner Plugin
 */
const plugin: FlynnPlugin = {
  id: "security-scanner",
  name: "Security Scanner Plugin",
  version: "1.0.0",
  description: "Automated security scanning and vulnerability detection",

  agents: [securityScannerAgent],
  skills: [owaspSkill, dependencyAuditSkill],
  workflows: [securityScanWorkflow, vulnerabilityFixWorkflow],

  async initialize(context: PluginContext) {
    context.log.info("Security Scanner plugin initializing...");

    // Register agents
    for (const agent of plugin.agents || []) {
      context.registerAgent(agent);
    }

    // Register skills
    for (const skill of plugin.skills || []) {
      context.registerSkill(skill);
    }

    // Register workflows
    for (const workflow of plugin.workflows || []) {
      context.registerWorkflow(workflow);
    }

    // Register a pre-commit hook for security checks
    context.registerHook({
      event: "PreToolUse",
      type: "command",
      command: "echo 'Security check triggered'",
      description: "Log when tools are used",
    });

    context.log.info("Security Scanner plugin initialized");
  },

  async destroy() {
    // Cleanup if needed
  },
};

export default plugin;

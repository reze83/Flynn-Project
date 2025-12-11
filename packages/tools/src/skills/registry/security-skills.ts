/**
 * Security Skills - Defense in Depth and Security Patterns
 */

import type { Skill } from "../types.js";

export const defenseInDepth: Skill = {
  id: "defense-in-depth",
  name: "Defense in Depth",
  description:
    "Implement multi-layered security approaches with redundant controls at every level.",
  category: "security",
  triggers: [
    "security",
    "defense",
    "protect",
    "secure",
    "vulnerability",
    "attack",
    "threat",
    "hardening",
    "authentication",
    "authorization",
  ],
  tier1TokenEstimate: 50,
  tier2TokenEstimate: 2600,
  instructions: `# Defense in Depth

Implement multi-layered security with redundant controls.

## Core Principle
Never rely on a single security control. If one layer fails, others still protect the system.

## Security Layers

### Layer 1: Perimeter Security
\`\`\`
┌─────────────────────────────────────┐
│           PERIMETER                 │
│  • Firewall rules                   │
│  • DDoS protection                  │
│  • Rate limiting                    │
│  • WAF (Web Application Firewall)   │
└─────────────────────────────────────┘
\`\`\`

**Controls:**
- Network segmentation
- IP allowlisting/blocklisting
- TLS/SSL everywhere
- CDN with security features

### Layer 2: Application Security
\`\`\`
┌─────────────────────────────────────┐
│          APPLICATION                │
│  • Input validation                 │
│  • Output encoding                  │
│  • Authentication                   │
│  • Authorization                    │
└─────────────────────────────────────┘
\`\`\`

**Controls:**
\`\`\`typescript
// Input Validation
function validateInput(input: unknown): ValidatedInput {
  const schema = z.object({
    email: z.string().email(),
    name: z.string().min(1).max(100),
  });
  return schema.parse(input); // Throws on invalid
}

// Output Encoding
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Authorization Check
function authorize(user: User, resource: Resource, action: Action): boolean {
  // Never trust client-side checks alone
  return rbac.check(user.roles, resource, action);
}
\`\`\`

### Layer 3: Data Security
\`\`\`
┌─────────────────────────────────────┐
│             DATA                    │
│  • Encryption at rest               │
│  • Encryption in transit            │
│  • Access controls                  │
│  • Audit logging                    │
└─────────────────────────────────────┘
\`\`\`

**Controls:**
\`\`\`typescript
// Encryption at rest
const encrypted = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  data
);

// Never log sensitive data
logger.info('User logged in', {
  userId: user.id,
  // password: user.password // NEVER
});

// Audit trail
await auditLog.record({
  action: 'DATA_ACCESS',
  actor: user.id,
  resource: 'users',
  timestamp: new Date(),
});
\`\`\`

### Layer 4: Infrastructure Security
\`\`\`
┌─────────────────────────────────────┐
│         INFRASTRUCTURE              │
│  • Container isolation              │
│  • Secrets management               │
│  • Least privilege                  │
│  • Immutable infrastructure         │
└─────────────────────────────────────┘
\`\`\`

**Controls:**
\`\`\`yaml
# Kubernetes: Least privilege
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get"]  # Only what's needed
\`\`\`

## OWASP Top 10 Mitigations

| Vulnerability | Defense Layer | Mitigation |
|--------------|---------------|------------|
| Injection | Application | Parameterized queries, input validation |
| Broken Auth | Application | MFA, session management, rate limiting |
| Sensitive Data | Data | Encryption, minimal data retention |
| XXE | Application | Disable external entities |
| Broken Access | Application | RBAC, deny by default |
| Misconfig | Infrastructure | Security hardening, automated scanning |
| XSS | Application | Output encoding, CSP headers |
| Deserialization | Application | Avoid deserializing untrusted data |
| Components | Infrastructure | Dependency scanning, updates |
| Logging | All | Centralized logging, monitoring |

## Security Checklist

### Authentication
- [ ] Multi-factor authentication available
- [ ] Password hashing (bcrypt/argon2)
- [ ] Session timeout configured
- [ ] Brute force protection

### Authorization
- [ ] Role-based access control
- [ ] Deny by default
- [ ] Resource-level permissions
- [ ] API authorization checks

### Data Protection
- [ ] TLS 1.3 for transit
- [ ] AES-256 for rest
- [ ] Secrets in vault (not env vars)
- [ ] PII minimization

### Monitoring
- [ ] Security event logging
- [ ] Anomaly detection
- [ ] Incident response plan
- [ ] Regular security audits

## Red Flags
- Single point of security failure
- Security through obscurity
- Hardcoded credentials
- Disabled security features "for testing"
- Missing audit logs`,
  resources: [
    "https://owasp.org/www-project-top-ten/",
    "https://github.com/obra/superpowers/blob/main/skills/defense-in-depth/SKILL.md",
  ],
};

export const SECURITY_SKILLS: Record<string, Skill> = {
  "defense-in-depth": defenseInDepth,
};

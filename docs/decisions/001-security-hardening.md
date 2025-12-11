# ADR-001: Security Hardening

## Status
Accepted

## Date
2025-12-08

## Context
The Flynn MCP server executes shell commands and file operations on behalf of AI agents. Security vulnerabilities were identified in the code review:

1. **allowUnsafe bypass**: The `allowUnsafe` flag could bypass all command validation
2. **Path traversal**: Insufficient validation allowed access outside project root
3. **Regex bypass**: Shell command patterns could be circumvented
4. **Prototype pollution**: JSON.parse without sanitization

## Decision

### 1. Remove allowUnsafe Flag
The `allowUnsafe` parameter has been removed entirely from `shell.ts`. All commands must now pass validation - there is no bypass mechanism.

### 2. Path Traversal Protection
Added `isPathWithinBase()` function that:
- Normalizes and resolves paths
- Validates paths stay within PROJECT_ROOT
- Blocks sensitive directories (.ssh, .aws, .env files)
- Fails closed (denies) if policy cannot be loaded

### 3. Enhanced Shell Regex Patterns
Expanded BLOCKED_PATTERNS to cover:
- Multiple flag orderings (`rm -rf`, `rm -fr`)
- Full paths to commands (`/usr/bin/sudo`)
- Various shell injection vectors (backticks, `$()`)
- Network tools in dangerous modes (`nc -e`)

### 4. Safe JSON Parsing
Created `safeJsonParse()` helper that blocks:
- `__proto__`
- `constructor`
- `prototype`

### 5. Plugin Installer Input Validation
Added validation for plugin installer inputs before shell execution:

**NPM Package Names (`isValidPackageName`):**
- Validates against npm package name pattern
- Blocks shell metacharacters: `; & | \` $ ( ) { } [ ] < > \ ! #`
- Blocks path traversal: `..`
- Blocks whitespace (command separation)
- Blocks flag injection: names starting with `-`

**Git URLs (`isValidGitUrl`):**
- Validates against known git URL patterns (https, ssh, shorthand)
- Blocks shell metacharacters and whitespace

## Consequences

### Positive
- Eliminates known security vulnerabilities
- Fail-closed approach prevents unknown bypasses
- Comprehensive protection against common attack vectors

### Negative
- Some legitimate commands may be blocked (false positives)
- Users cannot bypass restrictions even when intentional
- Slightly more restrictive than before

### Mitigation
- ALLOWED_PATTERNS can be extended for legitimate use cases
- Policy file allows customization per project

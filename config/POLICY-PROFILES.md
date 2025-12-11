# Flynn Policy Profiles

Flynn uses YAML-based policy files to control what agents can do. This document describes the available profiles and when to use them.

## Quick Reference

| Profile | Network | Shell | Use Case |
|---------|---------|-------|----------|
| `default` | AI APIs + registries | Dev tools | Normal development |
| `strict` | None | Read-only | Code review, auditing |
| `airgapped` | None | Read-only | Offline/secure environments |

## Activating a Profile

Set the `FLYNN_POLICY_PROFILE` environment variable:

```bash
# Use default (flynn.policy.yaml)
unset FLYNN_POLICY_PROFILE

# Use strict profile
export FLYNN_POLICY_PROFILE=strict

# Use airgapped profile
export FLYNN_POLICY_PROFILE=airgapped
```

Or specify a custom path:
```bash
export FLYNN_POLICY_PATH=/path/to/custom.policy.yaml
```

---

## Profile Details

### Default (`flynn.policy.yaml`)

**Use when:** Normal development work

**Network Access:**
- `api.anthropic.com` - Claude API
- `api.openai.com` - OpenAI API
- `registry.npmjs.org` - npm packages
- `pypi.org` - Python packages
- `github.com` - Repository access

**Shell Commands:**
- `git *` - Full git access
- `pnpm *`, `npm *` - Package management
- `node *`, `python *` - Runtime execution
- `tsc *`, `biome *`, `vitest *` - Build tools

**Blocked:**
- `sudo *` - No root access
- `rm -rf /`, `rm -rf ~` - Destructive commands
- `curl * | bash` - Remote code execution

**Agent Limits:**
- Max iterations: 10
- Timeout: 300s (5 min)
- Max retries: 3

---

### Strict (`flynn.policy.strict.yaml`)

**Use when:**
- Code review where you don't want changes
- Auditing existing code
- Demo/presentation environments
- When you want maximum safety

**Network Access:** None (all blocked)

**Shell Commands:**
- `git status`, `git show` - Read-only git
- `node -v`, `npm -v` - Version checks only
- Everything else blocked

**File Access:**
- Project directory only
- No writes outside project

**Agent Limits:**
- Max iterations: 5
- Timeout: 120s (2 min)
- Max retries: 1

---

### Airgapped (`flynn.policy.airgapped.yaml`)

**Use when:**
- No internet connectivity
- Secure/isolated environments
- Sensitive codebases
- Compliance requirements

**Network Access:** None (all blocked)

**Shell Commands:**
- `git status`, `git show` - Read-only git
- `node -v`, `npm -v` - Version checks only
- Everything else blocked

**File Access:**
- Project directory only
- No writes outside project

**Agent Limits:**
- Max iterations: 5
- Timeout: 120s (2 min)
- Max retries: 1

---

## Creating Custom Profiles

Create a new file `config/flynn.policy.{name}.yaml`:

```yaml
version: "1.0"

permissions:
  shell:
    allow:
      - "git *"
      # Add your allowed commands
    deny:
      - "sudo *"
      # Add blocked commands

  paths:
    whitelist:
      - "${PROJECT_ROOT}/**"
    writable:
      - "${PROJECT_ROOT}/**"
    readonly:
      - "/etc"

  network:
    allow:
      - "api.anthropic.com"
    deny:
      - "*"  # Block everything else

agents:
  max_iterations: 10
  timeout_seconds: 300
  max_retries: 3

logging:
  level: info
  format: json
  include_timestamps: true
```

Then activate with:
```bash
export FLYNN_POLICY_PROFILE=name
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `FLYNN_POLICY_PROFILE` | Profile name (without `.yaml`) |
| `PROJECT_ROOT` | Auto-detected or set manually |
| `XDG_DATA_HOME` | Data directory (default: `~/.local/share`) |
| `XDG_CACHE_HOME` | Cache directory (default: `~/.cache`) |

---

## Security Notes

1. **Deny takes precedence** - If a command matches both allow and deny, it's blocked
2. **Whitelist is strict** - If set, only whitelisted paths are accessible
3. **Network deny `*`** - Blocks all hosts not explicitly allowed
4. **No sudo** - Root access is always blocked in all profiles

# Troubleshooting Guide

Common issues and solutions when using Flynn.

## Installation Issues

### pnpm install fails

**Symptoms:**
```
ERR_PNPM_PEER_DEP_ISSUES
```

**Solution:**
```bash
# Clear pnpm cache
pnpm store prune

# Install with force
pnpm install --force
```

### Node version mismatch

**Symptoms:**
```
error: The engine "node" is incompatible with this module
```

**Solution:**
```bash
# Check your Node version
node --version

# Install Node 20+ using nvm
nvm install 20
nvm use 20
```

### Python tools not working

**Symptoms:**
```
ModuleNotFoundError: No module named 'pandas'
```

**Solution:**
```bash
cd packages/python
uv sync  # Or: pip install -r requirements.txt
```

### pnpm build script warnings

**Symptoms:**
```
Warning: Ignored build scripts: @biomejs/biome, esbuild, onnxruntime-node, protobufjs, sharp.
Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
```

**Explanation:**
This is a security warning from pnpm 10.x. The mentioned packages have post-install scripts that download or compile native binaries. The warning is **informational only** and can be safely ignored because:

1. These packages include pre-compiled binaries for most platforms
2. The `.npmrc` file in the repository already configures pnpm to allow build scripts
3. All tools function correctly without running the build scripts

**Solution:**
If you cloned the repository, the `.npmrc` is already included and configured. If you encounter issues with any of these packages:

```bash
# The .npmrc file should contain:
enable-pre-post-scripts=true
ignore-scripts=false

# Force rebuild specific packages if needed
pnpm rebuild @biomejs/biome sharp
```

**Note:** The Flynn installer (`install.sh`) automatically creates this `.npmrc` file during installation.

## Build Issues

### TypeScript compilation errors

**Symptoms:**
```
error TS2307: Cannot find module '@flynn/core'
```

**Solution:**
```bash
# Build packages in dependency order
pnpm build

# Or build specific package
pnpm --filter @flynn/core build
pnpm --filter @flynn/tools build
```

### Biome lint errors

**Symptoms:**
```
error: Diagnostic error detected
```

**Solution:**
```bash
# Auto-fix most issues
pnpm lint:fix

# Check remaining issues
pnpm lint
```

## Runtime Issues

### MCP server won't start

**Symptoms:**
```
Error: Cannot find module '/path/to/flynn/apps/server/dist/server.js'
```

**Solution:**
1. Ensure the project is built:
```bash
pnpm build
```

2. Check the path in your Claude settings:
```json
{
  "mcpServers": {
    "flynn": {
      "command": "node",
      "args": ["/absolute/path/to/flynn/apps/server/dist/server.js"]
    }
  }
}
```

### Command blocked by shell tool

**Symptoms:**
```
Command blocked: matches security pattern
```

**Explanation:**
Flynn blocks potentially dangerous commands for security. The following patterns are blocked:

- `rm -rf /` (recursive delete of root)
- `sudo` commands
- `chmod 777` (insecure permissions)
- Writing to system directories (`/etc`, `/usr`, `/bin`)
- Pipe to shell (`curl ... | sh`)
- Command substitution (`$(...)`, backticks)
- Fork bombs

**Solution:**
If your command is legitimately safe:

1. Break it into safer components
2. Use the `file-ops` tool instead for file operations
3. Run the command manually outside Flynn

### Task routing to wrong agent

**Symptoms:**
Agent selected doesn't match the task type.

**Solution:**
1. Use explicit workflow selection:
```
mcp__flynn__orchestrate({
  task: "your task",
  workflow: "security-audit"  // Explicit workflow
})
```

2. Use explicit agent selection:
```
mcp__flynn__get-agent-context({
  task: "your task",
  agent: "security"  // Explicit agent
})
```

3. Check trigger keywords in your task description

### Workflow not found

**Symptoms:**
```
Unknown workflow: documentation-suite
```

**Cause:**
The MCP server is running old code and needs to be restarted after updates.

**Solution:**
1. Rebuild the project:
```bash
pnpm build
```

2. Restart Claude Code to reload MCP servers

3. Or restart the MCP server process manually

## Test Issues

### Tests failing locally

**Symptoms:**
```
FAIL packages/tools/__tests__/shell.test.ts
```

**Solution:**
```bash
# Run specific test file
pnpm test -- packages/tools/__tests__/shell.test.ts

# Run with verbose output
pnpm test -- --reporter=verbose
```

### RAG E2E tests skipped in CI

**Symptoms:**
```
10 tests skipped
```

**Explanation:**
RAG E2E tests require downloading ML embedding models (~50MB) and are intentionally skipped in CI environments to avoid long download times.

**Running locally:**
```bash
# Set CI=false to run all tests
CI=false pnpm test
```

### Test timeout issues

**Symptoms:**
```
Error: Test timed out in 5000ms
```

**Solution:**
Increase timeout in test file:
```typescript
test("slow test", async () => {
  // test code
}, 30000);  // 30 second timeout
```

## Performance Issues

### High memory usage

**Symptoms:**
Process consuming excessive memory over time.

**Cause:**
Unbounded arrays growing without limits.

**Solution:**
Flynn now uses CircularBuffers for bounded memory. If you're on an older version:

1. Update to latest version
2. Configure buffer sizes if needed:
```typescript
const monitor = new ConversationMonitor({
  eventBufferSize: 1000,   // Max events to keep
  tokenBufferSize: 500,    // Max token records
});
```

### Slow task routing

**Symptoms:**
Task routing takes longer than expected.

**Solution:**
Flynn 1.0+ uses trigger indexing for O(1) lookups. If on older version:

1. Update to latest
2. Reduce number of keywords in task description
3. Use explicit agent/workflow selection

## Configuration Issues

### Policy profile not applied

**Symptoms:**
Commands that should be blocked are allowed (or vice versa).

**Solution:**
1. Check environment variable:
```bash
echo $FLYNN_POLICY_PROFILE
```

2. Set the profile:
```bash
export FLYNN_POLICY_PROFILE=strict  # Options: default, strict, airgapped
```

3. Restart MCP server

### Claude settings not recognized

**Symptoms:**
Flynn tools not appearing in Claude Code.

**Solution:**
1. Verify settings file location:
   - Global: `~/.claude/settings.json`
   - Project: `.claude/settings.local.json`

2. Validate JSON syntax:
```bash
cat ~/.claude/settings.json | python -m json.tool
```

3. Check server path is absolute:
```json
{
  "mcpServers": {
    "flynn": {
      "command": "node",
      "args": ["/home/user/flynn/apps/server/dist/server.js"]
    }
  }
}
```

4. Restart Claude Code

## Getting Help

If your issue isn't covered here:

1. **Search existing issues:** Check GitHub Issues for similar problems
2. **Enable debug logging:** Set `debugMode: true` in configuration
3. **Collect logs:** Include error messages, stack traces, and configuration
4. **Open an issue:** Provide reproduction steps and environment details

### Debug Mode

Enable debug logging for more detailed output:

```typescript
const monitor = getConversationMonitor({ debugMode: true });
```

Or set environment variable:
```bash
export FLYNN_DEBUG=true
```

### Environment Information

When reporting issues, include:

```bash
# System info
node --version
pnpm --version
python3 --version

# Flynn health check
mcp__flynn__health-check({ checks: ["all"] })
```

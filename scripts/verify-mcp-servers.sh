#!/bin/bash
# MCP Server Verification Script
# Run this after restarting Claude Code to verify all servers are loaded
#
# NOTE: Detailed verification is now run BY DEFAULT via the main installer.
#   To skip it, use: ./install.sh --verify --verify-basic
#
# This standalone script remains for convenience and backward compatibility.

echo "=== MCP Server Verification ==="
echo ""

# Check if environment variables are loaded
echo "1. Checking Environment Variables..."
echo "   CONTEXT7_API_KEY: ${CONTEXT7_API_KEY:0:10}***"
echo "   EXA_API_KEY: ${EXA_API_KEY:0:10}***"
echo "   MEM0_API_KEY: ${MEM0_API_KEY:0:10}***"
echo "   GITHUB_TOKEN: ${GITHUB_TOKEN:0:10}***"
echo "   ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:0:10}***"
echo ""

# Check configuration files
echo "2. Checking Configuration Files..."
if [ -f ~/.config/claude-code/mcp.json ]; then
    SERVER_COUNT=$(jq '.servers | length' ~/.config/claude-code/mcp.json 2>/dev/null || echo "error")
    echo "   Global config (~/.config/claude-code/mcp.json): $SERVER_COUNT servers"
fi

if [ -f .claude/settings.json ]; then
    PROJECT_COUNT=$(jq '.mcpServers | length' .claude/settings.json 2>/dev/null || echo "error")
    echo "   Project config (.claude/settings.json): $PROJECT_COUNT servers"
fi
echo ""

# Expected servers
echo "3. Expected MCP Servers (11 total):"
EXPECTED_SERVERS=(
    "flynn"
    "serena"
    "context7"
    "exa"
    "sequential-thinking"
    "mem0"
    "filesystem"
    "git"
    "puppeteer"
    "docker"
    "github"
)

for server in "${EXPECTED_SERVERS[@]}"; do
    echo "   ✓ $server"
done
echo ""

# Check package availability
echo "4. Checking Package Runners..."
echo -n "   npx: "
command -v npx >/dev/null && echo "$(npx --version)" || echo "NOT FOUND"
echo -n "   uvx: "
command -v uvx >/dev/null && echo "$(uvx --version)" || echo "NOT FOUND"
echo -n "   node: "
command -v node >/dev/null && echo "$(node --version)" || echo "NOT FOUND"
echo ""

# Check Flynn server
echo "5. Checking Flynn Server..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FLYNN_ROOT="$(dirname "$SCRIPT_DIR")"
if [ -f "$FLYNN_ROOT/apps/server/dist/server.js" ]; then
    echo "   ✓ Flynn server.js exists"
else
    echo "   ✗ Flynn server.js NOT FOUND"
fi
echo ""

echo "=== Verification Complete ==="
echo ""
echo "To test in Claude Code, use the command:"
echo "  /flynn list-mcp-tools"
echo ""

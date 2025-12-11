# MCP Server Setup Guide

This guide explains how to set up and configure all 11 MCP (Model Context Protocol) servers for the Flynn Project.

## Quick Start

1. **Copy environment template:**
   ```bash
   cp .env.mcp.template .env.mcp
   ```

2. **Fill in API keys** in `.env.mcp` (see [API Keys](#api-keys) section)

3. **Load environment variables:**
   ```bash
   source .env.mcp  # Linux/Mac
   # or
   set -a; source .env.mcp; set +a  # More reliable
   ```

4. **Test MCP servers** (optional):
   ```bash
   # The servers will be automatically started by Claude Code
   # No manual testing required
   ```

## Configured MCP Servers

### 1. **Serena** (Local Code Analysis)
- **Purpose:** Semantic code navigation, symbol search, project memory
- **API Key Required:** ❌ No
- **Install Command:** `uvx --from git+https://github.com/oraios/serena serena start-mcp-server`
- **Key Tools:**
  - `find_symbol` - Find classes, functions, methods
  - `find_referencing_symbols` - Find references
  - `project_memory` - Store project-specific knowledge

### 2. **Context7** (Library Documentation)
- **Purpose:** Fetch up-to-date library/API documentation
- **API Key Required:** ✅ Yes (`CONTEXT7_API_KEY`)
- **Get API Key:** https://upstash.com/
- **Install Command:** `npx -y @upstash/context7-mcp`
- **Key Tools:**
  - `get-library-docs` - Get documentation
  - `resolve-library-id` - Find library IDs

### 3. **Exa** (Web Search & Research)
- **Purpose:** Web search, deep research, code context search
- **API Key Required:** ✅ Yes (`EXA_API_KEY`)
- **Get API Key:** https://exa.ai/
- **Install Command:** `npx -y exa-mcp-server tools=get_code_context_exa,web_search_exa,deep_search_exa,company_research,crawling,linkedin_search,deep_researcher_start,deep_researcher_check`
- **Key Tools:**
  - `web_search_exa` - Real-time web search
  - `get_code_context_exa` - Code snippets and examples
  - `deep_search_exa` - Advanced research
  - `deep_researcher_start/check` - AI-powered research

### 4. **Sequential-Thinking-Tools**
- **Purpose:** Structured step-by-step reasoning
- **API Key Required:** ❌ No
- **Install Command:** `npx -y mcp-sequentialthinking-tools`
- **Key Tools:**
  - `sequentialthinking_tools` - Chain-of-thought reasoning

### 5. **Mem0** (Persistent Memory)
- **Purpose:** Long-term knowledge storage
- **API Key Required:** ✅ Yes (`MEM0_API_KEY`)
- **Get API Key:** https://mem0.ai/
- **Install Command:** `uvx mem0-mcp-server`
- **Key Tools:**
  - `memory_write` - Store memories
  - `memory_search` - Search memories

### 6. **Filesystem** (File Operations)
- **Purpose:** Read/write/watch files in the project
- **API Key Required:** ❌ No
- **Install Command:** `npx -y @modelcontextprotocol/server-filesystem /path/to/your/workspace`
- **Key Tools:**
  - `read_file` - Read files
  - `write_file` - Write files
  - `list` - List directory contents
  - `stat` - File metadata
  - `watch` - Watch for changes

### 7. **Git** (Version Control)
- **Purpose:** Local Git operations
- **API Key Required:** ❌ No
- **Install Command:** `npx -y @modelcontextprotocol/server-git`
- **Key Tools:**
  - `git_status` - Check status
  - `git_diff` - View changes
  - `git_log` - View history
  - `git_create_branch` - Create branches
  - `git_commit` - Create commits

### 8. **Puppeteer** (Headless Browser)
- **Purpose:** Screenshots, scraping, DOM checks
- **API Key Required:** ❌ No
- **Install Command:** `npx -y @modelcontextprotocol/server-puppeteer`
- **Key Tools:**
  - `open_page/puppeteer_navigate` - Navigate to URL
  - `screenshot/puppeteer_screenshot` - Take screenshots
  - `evaluate/puppeteer_evaluate` - Run JavaScript
  - `click`, `type` - Interact with elements

### 9. **Docker** (Container Management)
- **Purpose:** Manage local containers and images
- **API Key Required:** ❌ No
- **Install Command:** `npx -y @quantgeekdev/docker-mcp`
- **Key Tools:**
  - `list-containers` - List containers
  - `get-logs` - View logs
  - `create-container` - Create containers
  - `deploy-compose` - Deploy with docker-compose

### 10. **GitHub** (Repository Management)
- **Purpose:** Issues, PRs, reviews, actions
- **API Key Required:** ✅ Yes (`GITHUB_TOKEN`)
- **Get API Key:** https://github.com/settings/tokens
- **Required Scopes:** `repo`, `read:org`, `workflow`
- **Install Command:** `npx -y @modelcontextprotocol/server-github`
- **Key Tools:**
  - `search_issues` - Search issues
  - `list_prs` - List pull requests
  - `get_pr` - Get PR details
  - `create_comment` - Comment on issues/PRs
  - `workflows` - GitHub Actions

## API Keys

### Required API Keys

| Service | Environment Variable | Where to Get | Required For |
|---------|---------------------|--------------|--------------|
| Context7 | `CONTEXT7_API_KEY` | https://upstash.com/ | Library documentation |
| Exa | `EXA_API_KEY` | https://exa.ai/ | Web search & research |
| Mem0 | `MEM0_API_KEY` | https://mem0.ai/ | Persistent memory |
| GitHub | `GITHUB_TOKEN` | https://github.com/settings/tokens | GitHub operations |

### Setting Up API Keys

1. **Create `.env.mcp` from template:**
   ```bash
   cp .env.mcp.template .env.mcp
   ```

2. **Add your API keys to `.env.mcp`:**
   ```bash
   CONTEXT7_API_KEY=upsh_xxxxxxxxxxxxx
   EXA_API_KEY=exa_xxxxxxxxxxxxx
   MEM0_API_KEY=mem0_xxxxxxxxxxxxx
   GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
   ```

3. **Load environment variables:**
   ```bash
   source .env.mcp
   ```

   Or add to your shell profile (`~/.bashrc`, `~/.zshrc`):
   ```bash
   if [ -f "$HOME/Flynn-Project/.env.mcp" ]; then
     set -a
     source "$HOME/Flynn-Project/.env.mcp"
     set +a
   fi
   ```

## Configuration Files

### `.claude.json`
Main MCP server configuration file. This is automatically loaded by Claude Code.

**Location:** `~/.claude.json` (or project-specific `.claude.json`)

### `.env.mcp`
Environment variables for API keys. **Never commit this file!**

**Location:** `$FLYNN_PROJECT_PATH/.env.mcp` (copy from `.env.mcp.template`)

**Security:** Already added to `.gitignore`

## Troubleshooting

### Server Not Starting

**Problem:** MCP server fails to start

**Solutions:**
1. Check that environment variables are loaded:
   ```bash
   echo $CONTEXT7_API_KEY
   ```

2. Verify API keys are valid

3. Check server logs in `.claude/debug/`

### Missing API Key Error

**Problem:** Server requires API key but can't find it

**Solution:**
```bash
# Load environment variables
source .env.mcp

# Verify
env | grep -E "(CONTEXT7|EXA|MEM0|GITHUB)"
```

### Permission Issues

**Problem:** Cannot execute MCP server

**Solution:**
```bash
# For uvx-based servers (serena, mem0)
pip install uv

# For npx-based servers
npm install -g npm
```

### Port Already in Use

**Problem:** Server port conflicts

**Solution:**
MCP servers use stdio transport by default, so port conflicts shouldn't occur. If they do, restart Claude Code.

## Testing MCP Servers

### Manual Testing (Optional)

You can test individual servers using the following commands:

```bash
# Test Serena
uvx --from git+https://github.com/oraios/serena serena start-mcp-server

# Test Context7
CONTEXT7_API_KEY=your_key npx -y @upstash/context7-mcp

# Test Exa
EXA_API_KEY=your_key npx -y exa-mcp-server tools=web_search_exa

# Test Sequential Thinking
npx -y mcp-sequentialthinking-tools

# Test Mem0
MEM0_API_KEY=your_key uvx mem0-mcp-server

# Test Filesystem
npx -y @modelcontextprotocol/server-filesystem /path/to/your/project

# Test Git
npx -y @modelcontextprotocol/server-git

# Test Puppeteer
npx -y @modelcontextprotocol/server-puppeteer

# Test Docker
npx -y @quantgeekdev/docker-mcp

# Test GitHub
GITHUB_TOKEN=your_token npx -y @modelcontextprotocol/server-github
```

### Verify in Claude Code

1. Start Claude Code
2. Check that MCP servers are loaded in the status bar
3. Try using a tool from each server

## Best Practices

### Security

1. **Never commit API keys** - `.env.mcp` is in `.gitignore`
2. **Use environment variables** - Don't hardcode keys
3. **Rotate keys regularly** - Generate new tokens periodically
4. **Limit token scope** - Give minimum required permissions

### Performance

1. **Only enable needed servers** - Comment out unused servers in `.claude.json`
2. **Monitor resource usage** - Some servers (Puppeteer) can be memory-intensive
3. **Use caching** - Exa and Context7 have built-in caching

### Maintenance

1. **Update regularly:**
   ```bash
   # Check for updates
   npx npm-check-updates

   # Update specific server
   npx -y @modelcontextprotocol/server-filesystem@latest
   ```

2. **Check logs** - Review `.claude/debug/` for errors

3. **Clean cache periodically:**
   ```bash
   rm -rf ~/.cache/uv/
   rm -rf ~/.npm/_cacache/
   ```

## Additional Resources

- [MCP Specification](https://modelcontextprotocol.io/)
- [Flynn Project Documentation](./README.md)
- [MCP Server Reference](./MCP-SERVER-REFERENCE.md)
- [Claude Code Documentation](https://docs.anthropic.com/claude-code)

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review server logs in `.claude/debug/`
3. Open an issue in the project repository

---

**Last Updated:** 2025-12-11
**Created for:** Flynn-Project
**MCP Servers:** 10 configured (6 without API keys, 4 with API keys) - SQLite removed

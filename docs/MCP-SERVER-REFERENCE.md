# Flynn MCP Server Reference Guide

The servers we actually use and recommend.

## Quick Server Overview

| Server | Purpose | Needs API key? |
|--------|---------|----------------|
| Serena | Local code analysis, symbol navigation, project memory | no |
| Context7 | Fetch library/API documentation from the web | yes (`CONTEXT7_API_KEY`) |
| Exa | Web search, deep research, crawling, code-context search | yes (`EXA_API_KEY`) |
| Sequential-Thinking-Tools | Structured step-by-step reasoning helpers | no |
| Mem0 | Persistent storage for user/project knowledge | yes (`MEM0_API_KEY`) |
| Filesystem | Read/write/watch files in the project | no |
| Git | Local Git operations (status, diff, commit, branch) | no |
| SQLite | SQL queries and schema inspection on local DB files | no |
| Puppeteer | Headless browser for screenshots, scraping, DOM checks | no |
| Docker | Manage local containers, logs, and images | no |
| GitHub | Issues/PRs/reviews/actions via GitHub API | yes (`GITHUB_TOKEN`) |

## Key Tools per Server

Use **Serena** when you need code-aware navigation/memory; use **Filesystem** for plain file I/O.

- **Serena:** find_symbol, references, project_memory (plus code-aware read_file/ls)
- **Context7:** get-library-docs, resolve-library-id
- **Exa:** get_code_context_exa, web_search_exa, deep_search_exa, company_research, crawling/crawling_exa, linkedin_search, deep_researcher_start, deep_researcher_check
- **Sequential-Thinking-Tools:** sequentialthinking_tools (alias sequentialthinking)
- **Mem0:** memory_write, memory_search (server-specific naming)
- **Filesystem:** read_file, write_file, list, stat, watch (plain I/O)
- **Git:** git_status, git_diff_unstaged/git_diff, git_log, git_create_branch, git_commit (varies by version)
- **SQLite:** execute_sql, list_tables, describe_table
- **Puppeteer:** open_page/puppeteer_navigate, screenshot/puppeteer_screenshot, evaluate/puppeteer_evaluate, click, type (varies by version)
- **Docker:** list-containers, get-logs, create-container, deploy-compose (plus start/stop/exec per version)
- **GitHub:** search_issues, list_prs, get_pr, create_comment, workflows (permission-dependent)

## Install Commands

- Serena: `uvx --from git+https://github.com/oraios/serena serena start-mcp-server`
- Context7: `npx -y @upstash/context7-mcp`
- Exa: `npx -y exa-mcp-server tools=get_code_context_exa,web_search_exa,deep_search_exa,company_research,crawling,linkedin_search,deep_researcher_start,deep_researcher_check`
- Sequential-Thinking-Tools: `npx -y mcp-sequentialthinking-tools`
- Mem0: `uvx mem0-mcp-server`
- Filesystem: `npx -y @modelcontextprotocol/server-filesystem <workspace-root>`
- Git: `npx -y @modelcontextprotocol/server-git`
- SQLite: `npx -y @modelcontextprotocol/server-sqlite /path/to/db.sqlite`
- Puppeteer: `npx -y @modelcontextprotocol/server-puppeteer`
- Docker: `npx -y @quantgeekdev/docker-mcp`
- GitHub: `npx -y @modelcontextprotocol/server-github`

## Example Configuration (`.claude.json`)

```json
{
  "mcpServers": {
    "serena": {
      "command": "uvx",
      "args": ["--from", "git+https://github.com/oraios/serena", "serena", "start-mcp-server"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"],
      "env": { "CONTEXT7_API_KEY": "${CONTEXT7_API_KEY}" }
    },
    "exa": {
      "command": "npx",
      "args": ["-y", "exa-mcp-server", "tools=get_code_context_exa,web_search_exa,deep_search_exa,company_research,crawling,linkedin_search,deep_researcher_start,deep_researcher_check"],
      "env": { "EXA_API_KEY": "${EXA_API_KEY}" }
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "mcp-sequentialthinking-tools"]
    },
    "mem0": {
      "command": "uvx",
      "args": ["mem0-mcp-server"],
      "env": { "MEM0_API_KEY": "${MEM0_API_KEY}" }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "<workspace-root>"]
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git"]
    },
    "sqlite": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sqlite", "/path/to/db.sqlite"]
    },
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    },
    "docker": {
      "command": "npx",
      "args": ["-y", "@quantgeekdev/docker-mcp"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }
    }
  }
}
```

---

*Last updated: 2025-12-09*
*Created for: Flynn-Project*

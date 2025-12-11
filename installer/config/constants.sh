#!/usr/bin/env bash
# ============================================================================
# Module: config/constants.sh
# Description: All constants, paths, and arrays for Flynn installer
# Author: Flynn Project
# Version: 2.0.0
# Dependencies: None
# ============================================================================
# Source: Google Bash Style Guide, Cursor Rules 2025
# Pattern: Centralized Configuration
# ============================================================================

# Prevent multiple sourcing
[[ -n "${_CONSTANTS_SOURCED:-}" ]] && return 0
readonly _CONSTANTS_SOURCED=1

# ─────────────────────────────────────────────────────────────────────────────
# Version Constants
# ─────────────────────────────────────────────────────────────────────────────

readonly FLYNN_VERSION="2.0.0"
readonly FLYNN_MIN_VERSION="1.0.0"
readonly NODE_VERSION="22"
readonly PYTHON_VERSION="3.11"

# ─────────────────────────────────────────────────────────────────────────────
# XDG-compliant Paths
# ─────────────────────────────────────────────────────────────────────────────

readonly LOCAL_BIN="${HOME}/.local/bin"
readonly LOCAL_SHARE="${HOME}/.local/share"
readonly FLYNN_DIR="${LOCAL_SHARE}/flynn"
readonly FLYNN_MCP_SERVER_PATH="${FLYNN_DIR}/apps/server/dist/server.js"
readonly FLYNN_CONFIG_DIR="${HOME}/.config/flynn"
readonly FLYNN_LOG_DIR="${HOME}/.flynn"
readonly FLYNN_LOG_FILE="${FLYNN_LOG_DIR}/install.log"
readonly FLYNN_BACKUP_DIR="${FLYNN_LOG_DIR}/backups"

# ─────────────────────────────────────────────────────────────────────────────
# Claude Code Paths
# ─────────────────────────────────────────────────────────────────────────────

readonly CLAUDE_JSON="${HOME}/.claude.json"
readonly CLAUDE_SETTINGS="${HOME}/.claude/settings.json"
readonly CLAUDE_COMMANDS_DIR="${HOME}/.claude/commands"

# ─────────────────────────────────────────────────────────────────────────────
# Terminal Colors (ANSI escape codes)
# ─────────────────────────────────────────────────────────────────────────────

readonly CYAN='\033[0;36m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly RED='\033[0;31m'
readonly DIM='\033[2m'
readonly BOLD='\033[1m'
readonly NC='\033[0m'

# ─────────────────────────────────────────────────────────────────────────────
# Spinner Configuration
# ─────────────────────────────────────────────────────────────────────────────

readonly SPINNER_FRAMES=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")

# ─────────────────────────────────────────────────────────────────────────────
# Flynn MCP Tools
# ─────────────────────────────────────────────────────────────────────────────

readonly FLYNN_TOOLS=(
    "mcp__flynn__analyze-project"
    "mcp__flynn__system-info"
    "mcp__flynn__route-task"
    "mcp__flynn__get-agent-context"
    "mcp__flynn__orchestrate"
    "mcp__flynn__list-workflows"
    "mcp__flynn__heal-error"
    "mcp__flynn__git-ops"
    "mcp__flynn__file-ops"
    "mcp__flynn__shell"
    "mcp__flynn__get-skill"
    "mcp__flynn__list-skills"
    "mcp__flynn__generate-hooks"
    "mcp__flynn__health-check"
    "mcp__flynn__analytics"
    "mcp__flynn__list-mcp-tools"
    "mcp__flynn__codex-delegate"
    "mcp__flynn__codex-md-generator"
)

# ─────────────────────────────────────────────────────────────────────────────
# External MCP Server Tools
# ─────────────────────────────────────────────────────────────────────────────

readonly EXTERNAL_MCP_TOOLS=(
    # Serena - Code analysis and manipulation (29 tools)
    "mcp__serena__read_file"
    "mcp__serena__create_text_file"
    "mcp__serena__list_dir"
    "mcp__serena__find_file"
    "mcp__serena__replace_content"
    "mcp__serena__search_for_pattern"
    "mcp__serena__get_symbols_overview"
    "mcp__serena__find_symbol"
    "mcp__serena__find_referencing_symbols"
    "mcp__serena__replace_symbol_body"
    "mcp__serena__insert_after_symbol"
    "mcp__serena__insert_before_symbol"
    "mcp__serena__rename_symbol"
    "mcp__serena__write_memory"
    "mcp__serena__read_memory"
    "mcp__serena__list_memories"
    "mcp__serena__delete_memory"
    "mcp__serena__edit_memory"
    "mcp__serena__execute_shell_command"
    "mcp__serena__activate_project"
    "mcp__serena__switch_modes"
    "mcp__serena__get_current_config"
    "mcp__serena__check_onboarding_performed"
    "mcp__serena__onboarding"
    "mcp__serena__think_about_collected_information"
    "mcp__serena__think_about_task_adherence"
    "mcp__serena__think_about_whether_you_are_done"
    "mcp__serena__prepare_for_new_conversation"
    "mcp__serena__initial_instructions"

    # Context7 - Library documentation (2 tools)
    "mcp__context7__resolve-library-id"
    "mcp__context7__get-library-docs"

    # Exa - Web search and research (6 tools)
    "mcp__exa__web_search_exa"
    "mcp__exa__deep_search_exa"
    "mcp__exa__crawling_exa"
    "mcp__exa__deep_researcher_start"
    "mcp__exa__deep_researcher_check"
    "mcp__exa__get_code_context_exa"

    # Sequential Thinking - Reasoning tools (1 tool)
    "mcp__sequentialthinking-tools__sequentialthinking_tools"

    # Mem0 - Memory operations (9 tools)
    "mcp__mem0__add_memory"
    "mcp__mem0__search_memories"
    "mcp__mem0__get_memories"
    "mcp__mem0__delete_all_memories"
    "mcp__mem0__list_entities"
    "mcp__mem0__get_memory"
    "mcp__mem0__update_memory"
    "mcp__mem0__delete_memory"
    "mcp__mem0__delete_entities"

    # Filesystem - File operations (8 tools)
    "mcp__filesystem__read_file"
    "mcp__filesystem__write_file"
    "mcp__filesystem__list_directory"
    "mcp__filesystem__list_allowed_directories"
    "mcp__filesystem__create_directory"
    "mcp__filesystem__move_file"
    "mcp__filesystem__search_files"
    "mcp__filesystem__get_file_info"

    # Git - Git operations (25 tools)
    "mcp__git__git_add"
    "mcp__git__git_branch"
    "mcp__git__git_checkout"
    "mcp__git__git_cherry_pick"
    "mcp__git__git_clean"
    "mcp__git__git_clear_working_dir"
    "mcp__git__git_clone"
    "mcp__git__git_commit"
    "mcp__git__git_diff"
    "mcp__git__git_fetch"
    "mcp__git__git_init"
    "mcp__git__git_log"
    "mcp__git__git_merge"
    "mcp__git__git_pull"
    "mcp__git__git_push"
    "mcp__git__git_rebase"
    "mcp__git__git_remote"
    "mcp__git__git_reset"
    "mcp__git__git_set_working_dir"
    "mcp__git__git_show"
    "mcp__git__git_stash"
    "mcp__git__git_status"
    "mcp__git__git_tag"
    "mcp__git__git_worktree"
    "mcp__git__git_wrapup_instructions"

    # Puppeteer - Browser automation (7 tools)
    "mcp__puppeteer__puppeteer_navigate"
    "mcp__puppeteer__puppeteer_screenshot"
    "mcp__puppeteer__puppeteer_click"
    "mcp__puppeteer__puppeteer_fill"
    "mcp__puppeteer__puppeteer_select"
    "mcp__puppeteer__puppeteer_hover"
    "mcp__puppeteer__puppeteer_evaluate"

    # Docker - Container management (8 tools)
    "mcp__docker__docker_container_list"
    "mcp__docker__docker_container_inspect"
    "mcp__docker__docker_container_start"
    "mcp__docker__docker_container_stop"
    "mcp__docker__docker_container_restart"
    "mcp__docker__docker_container_logs"
    "mcp__docker__docker_system_info"
    "mcp__docker__docker_system_version"

    # GitHub - Repository management (25 tools)
    "mcp__github__create_or_update_file"
    "mcp__github__search_repositories"
    "mcp__github__create_repository"
    "mcp__github__get_file_contents"
    "mcp__github__push_files"
    "mcp__github__create_issue"
    "mcp__github__create_pull_request"
    "mcp__github__fork_repository"
    "mcp__github__create_branch"
    "mcp__github__list_commits"
    "mcp__github__list_issues"
    "mcp__github__update_issue"
    "mcp__github__add_issue_comment"
    "mcp__github__search_code"
    "mcp__github__search_issues"
    "mcp__github__search_users"
    "mcp__github__get_issue"
    "mcp__github__get_pull_request"
    "mcp__github__list_pull_requests"
    "mcp__github__create_pull_request_review"
    "mcp__github__merge_pull_request"
    "mcp__github__get_pull_request_files"
    "mcp__github__get_pull_request_status"
    "mcp__github__update_pull_request_branch"
    "mcp__github__get_pull_request_comments"
    "mcp__github__get_pull_request_reviews"
)

# ─────────────────────────────────────────────────────────────────────────────
# Puppeteer System Dependencies (Linux/WSL)
# ─────────────────────────────────────────────────────────────────────────────

readonly PUPPETEER_DEPS=(
    "libnss3"
    "libatk1.0-0t64"
    "libatk-bridge2.0-0t64"
    "libcups2t64"
    "libdrm2"
    "libxkbcommon0"
    "libxcomposite1"
    "libxdamage1"
    "libxfixes3"
    "libxrandr2"
    "libgbm1"
    "libasound2t64"
    "libpango-1.0-0"
    "libpangocairo-1.0-0"
    "libgtk-3-0t64"
    "libxshmfence1"
    "libglu1-mesa"
)

# ─────────────────────────────────────────────────────────────────────────────
# External MCP Servers Configuration
# ─────────────────────────────────────────────────────────────────────────────

declare -A EXTERNAL_MCP_SERVERS
EXTERNAL_MCP_SERVERS=(
    ["serena"]="npx:-y:@agentic/mcp-server-serena"
    ["context7"]="npx:-y:@upstash/context7-mcp"
    ["exa"]="npx:-y:exa-mcp-server"
    ["sequential-thinking"]="npx:-y:mcp-sequentialthinking-tools"
    ["mem0"]="uvx:--from:mem0-mcp-server:mem0-mcp-server"
    ["filesystem"]="npx:-y:@modelcontextprotocol/server-filesystem"
    ["git"]="npx:-y:@cyanheads/git-mcp-server"
    ["puppeteer"]="npx:-y:@modelcontextprotocol/server-puppeteer"
    ["docker"]="npx:-y:@zcaceres/server-docker"
    ["github"]="npx:-y:@modelcontextprotocol/server-github"
)

# ─────────────────────────────────────────────────────────────────────────────
# Expected MCP Servers (for verification)
# ─────────────────────────────────────────────────────────────────────────────

readonly EXPECTED_MCP_SERVERS=(
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

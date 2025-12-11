#!/usr/bin/env bash
# ============================================================================
# Module: lib/config.sh
# Description: Flynn and Claude Code configuration management
# Author: Flynn Project
# Version: 2.0.0
# Dependencies: config/constants.sh, lib/common.sh
# ============================================================================
# Source: Google Bash Style Guide, Cursor Rules 2025
# Pattern: Builder Pattern - Step-by-step configuration construction
# ============================================================================

# Prevent multiple sourcing
[[ -n "${_CONFIG_SOURCED:-}" ]] && return 0
readonly _CONFIG_SOURCED=1

# API Keys storage location (shared between Claude Code and Codex CLI)
readonly API_KEYS_FILE="${HOME}/.flynn/api-keys.env"

# ─────────────────────────────────────────────────────────────────────────────
# API Key Management
# ─────────────────────────────────────────────────────────────────────────────

# Prompt user for API keys (interactive mode only)
# Stores keys in ~/.flynn/api-keys.env for both CLIs
prompt_api_keys() {
    if [[ "${NON_INTERACTIVE:-false}" == true ]]; then
        return 0
    fi

    echo ""
    echo -e "  ${BOLD}API Keys Configuration${NC}"
    echo -e "  ${DIM}(Optional: Configure API keys for enhanced functionality)${NC}"
    echo ""

    # Create Flynn directory
    mkdir -p "$(dirname "$API_KEYS_FILE")"

    # Load existing keys if available
    local existing_context7=""
    local existing_exa=""
    local existing_mem0=""
    local existing_github=""
    local existing_anthropic=""
    local existing_openai=""

    if [[ -f "$API_KEYS_FILE" ]]; then
        # shellcheck source=/dev/null
        source "$API_KEYS_FILE" 2>/dev/null || true
        existing_context7="${CONTEXT7_API_KEY:-}"
        existing_exa="${EXA_API_KEY:-}"
        existing_mem0="${MEM0_API_KEY:-}"
        existing_github="${GITHUB_TOKEN:-}"
        existing_anthropic="${ANTHROPIC_API_KEY:-}"
        existing_openai="${OPENAI_API_KEY:-}"
    fi

    # Prompt for each key
    echo -e "  ${BOLD}1. Context7 API Key${NC} ${DIM}(Library documentation)${NC}"
    local context7_key
    context7_key=$(prompt_secret "Enter Context7 API key" "$existing_context7")

    echo ""
    echo -e "  ${BOLD}2. Exa API Key${NC} ${DIM}(Web search & research)${NC}"
    local exa_key
    exa_key=$(prompt_secret "Enter Exa API key" "$existing_exa")

    echo ""
    echo -e "  ${BOLD}3. Mem0 API Key${NC} ${DIM}(Persistent memory)${NC}"
    local mem0_key
    mem0_key=$(prompt_secret "Enter Mem0 API key" "$existing_mem0")

    echo ""
    echo -e "  ${BOLD}4. GitHub Token${NC} ${DIM}(Repository management)${NC}"
    local github_token
    github_token=$(prompt_secret "Enter GitHub token" "$existing_github")

    echo ""
    echo -e "  ${BOLD}5. Anthropic API Key${NC} ${DIM}(Claude Code)${NC}"
    local anthropic_key
    anthropic_key=$(prompt_secret "Enter Anthropic API key" "$existing_anthropic")

    echo ""
    echo -e "  ${BOLD}6. OpenAI API Key${NC} ${DIM}(Codex CLI)${NC}"
    local openai_key
    openai_key=$(prompt_secret "Enter OpenAI API key" "$existing_openai")

    # Write keys to file
    cat > "$API_KEYS_FILE" << EOF
# ============================================================================
# Flynn API Keys - Shared by Claude Code and Codex CLI
# ============================================================================
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Location: $API_KEYS_FILE
#
# This file is automatically sourced by your shell (~/.bashrc or ~/.zshrc)
# and used by both Claude Code and Codex CLI for MCP server authentication.
# ============================================================================

EOF

    [[ -n "$context7_key" ]] && echo "export CONTEXT7_API_KEY=\"$context7_key\"" >> "$API_KEYS_FILE"
    [[ -n "$exa_key" ]] && echo "export EXA_API_KEY=\"$exa_key\"" >> "$API_KEYS_FILE"
    [[ -n "$mem0_key" ]] && echo "export MEM0_API_KEY=\"$mem0_key\"" >> "$API_KEYS_FILE"
    [[ -n "$github_token" ]] && echo "export GITHUB_TOKEN=\"$github_token\"" >> "$API_KEYS_FILE"
    [[ -n "$anthropic_key" ]] && echo "export ANTHROPIC_API_KEY=\"$anthropic_key\"" >> "$API_KEYS_FILE"
    [[ -n "$openai_key" ]] && echo "export OPENAI_API_KEY=\"$openai_key\"" >> "$API_KEYS_FILE"

    # Make file readable only by user
    chmod 600 "$API_KEYS_FILE"

    # Add to shell RC if not already there
    _add_api_keys_to_shell_rc

    # Load keys into current environment
    # shellcheck source=/dev/null
    source "$API_KEYS_FILE"

    local keys_set=0
    [[ -n "$context7_key" ]] && ((keys_set++))
    [[ -n "$exa_key" ]] && ((keys_set++))
    [[ -n "$mem0_key" ]] && ((keys_set++))
    [[ -n "$github_token" ]] && ((keys_set++))
    [[ -n "$anthropic_key" ]] && ((keys_set++))
    [[ -n "$openai_key" ]] && ((keys_set++))

    echo ""
    print_done "API keys configured ($keys_set keys set)"
    log_info "API keys stored in $API_KEYS_FILE ($keys_set keys configured)"
}

# Add API keys file to shell RC
_add_api_keys_to_shell_rc() {
    local shell_rc
    shell_rc=$(get_shell_rc)

    if [[ -z "$shell_rc" ]]; then
        log_warn "Could not determine shell RC file"
        return 1
    fi

    if ! grep -q "api-keys.env" "$shell_rc" 2>/dev/null; then
        cat >> "$shell_rc" << 'EOF'

# Flynn API Keys (shared between Claude Code and Codex CLI)
if [ -f "$HOME/.flynn/api-keys.env" ]; then
    source "$HOME/.flynn/api-keys.env"
fi
EOF
        log_info "Added API keys sourcing to $shell_rc"
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
# Main Configuration Function
# ─────────────────────────────────────────────────────────────────────────────

configure_flynn() {
    _install_slash_command
    _register_mcp_server || return 1
    _configure_permissions || return 1

    # Configure Codex CLI if installed
    if command -v codex &>/dev/null; then
        configure_codex_cli
    fi

    return 0
}

# ─────────────────────────────────────────────────────────────────────────────
# Slash Command Installation
# ─────────────────────────────────────────────────────────────────────────────

_install_slash_command() {
    start_spinner "Installing /flynn slash command..."

    if [[ "${DRY_RUN:-false}" == true ]]; then
        stop_spinner "skip" "Would install /flynn slash command"
        return 0
    fi

    mkdir -p "$CLAUDE_COMMANDS_DIR"

    if [[ -f "$FLYNN_DIR/.claude/commands/flynn.md" ]]; then
        cp "$FLYNN_DIR/.claude/commands/flynn.md" "$CLAUDE_COMMANDS_DIR/flynn.md"
        stop_spinner "ok" "/flynn slash command installed"
    else
        stop_spinner "warn" "/flynn slash command not found"
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
# MCP Server Registration
# ─────────────────────────────────────────────────────────────────────────────

_register_mcp_server() {
    start_spinner "Registering Flynn MCP server..."

    if [[ "${DRY_RUN:-false}" == true ]]; then
        stop_spinner "skip" "Would register Flynn MCP server"
        return 0
    fi

    mkdir -p "$(dirname "$CLAUDE_JSON")"

    if [[ ! -f "$CLAUDE_JSON" ]]; then
        echo '{"mcpServers":{}}' > "$CLAUDE_JSON"
    fi

    node -e "
const fs = require('fs');
const configPath = '$CLAUDE_JSON';
const serverPath = '$FLYNN_MCP_SERVER_PATH';

let config = {};
try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
    config = {};
}

if (!config.mcpServers) {
    config.mcpServers = {};
}

config.mcpServers.flynn = {
    type: 'stdio',
    command: 'node',
    args: [serverPath]
};

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
" 2>/dev/null

    if [[ $? -eq 0 ]]; then
        stop_spinner "ok" "Flynn MCP server registered"
        return 0
    else
        stop_spinner "fail" "Failed to register MCP server"
        return 1
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
# Permissions Configuration
# ─────────────────────────────────────────────────────────────────────────────

_configure_permissions() {
    start_spinner "Configuring permissions..."

    mkdir -p "$(dirname "$CLAUDE_SETTINGS")"

    if [[ ! -f "$CLAUDE_SETTINGS" ]]; then
        echo '{"permissions":{"allow":[],"deny":[]}}' > "$CLAUDE_SETTINGS"
    fi

    # Merge Flynn tools and external MCP tools
    local all_tools=("${FLYNN_TOOLS[@]}" "${EXTERNAL_MCP_TOOLS[@]}")
    local tools_json
    tools_json=$(printf '%s\n' "${all_tools[@]}" | jq -R . | jq -s .)
    local total_tools=${#all_tools[@]}

    node -e "
const fs = require('fs');
const settingsPath = '$CLAUDE_SETTINGS';
const allTools = $tools_json;

let config = {};
try {
    config = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
} catch (e) {
    config = {};
}

if (!config.permissions) {
    config.permissions = { allow: [], deny: [] };
}
if (!config.permissions.allow) {
    config.permissions.allow = [];
}

for (const tool of allTools) {
    if (!config.permissions.allow.includes(tool)) {
        config.permissions.allow.push(tool);
    }
}

fs.writeFileSync(settingsPath, JSON.stringify(config, null, 2));
" 2>/dev/null

    if [[ $? -eq 0 ]]; then
        stop_spinner "ok" "Permissions configured ($total_tools tools: ${#FLYNN_TOOLS[@]} Flynn + ${#EXTERNAL_MCP_TOOLS[@]} external)"
        return 0
    else
        stop_spinner "fail" "Failed to configure permissions"
        return 1
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
# Codex CLI Configuration
# ─────────────────────────────────────────────────────────────────────────────
#
# Generates ~/.codex/config.toml with IDENTICAL configuration as Claude Code:
# - All 11 MCP servers (flynn, context7, exa, sequential-thinking, mem0, serena,
#   filesystem, git, puppeteer, docker, github)
# - Same security settings (sandbox_mode, approval_policy, trust_level)
# - API keys synced from environment or existing config
#
# This ensures both Claude Code and Codex CLI have the same capabilities.
# ─────────────────────────────────────────────────────────────────────────────

configure_codex_cli() {
    start_spinner "Configuring Codex CLI MCP servers..."

    if [[ "${DRY_RUN:-false}" == true ]]; then
        stop_spinner "skip" "Would configure Codex CLI"
        return 0
    fi

    local CODEX_DIR="${HOME}/.codex"
    local CODEX_CONFIG="${CODEX_DIR}/config.toml"

    mkdir -p "$CODEX_DIR"

    # Backup existing config
    if [[ -f "$CODEX_CONFIG" ]]; then
        cp "$CODEX_CONFIG" "${CODEX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
        log_info "Codex config backed up"
    fi

    # Load API keys from shared file (if exists)
    if [[ -f "$API_KEYS_FILE" ]]; then
        # shellcheck source=/dev/null
        source "$API_KEYS_FILE" 2>/dev/null || true
    fi

    # Get API keys from environment (already loaded from API_KEYS_FILE or set manually)
    local CONTEXT7_API_KEY="${CONTEXT7_API_KEY:-}"
    local EXA_API_KEY="${EXA_API_KEY:-}"
    local MEM0_API_KEY="${MEM0_API_KEY:-}"
    local GITHUB_TOKEN="${GITHUB_TOKEN:-}"

    # Fallback: read from existing Codex config if not in environment
    if [[ -f "$CODEX_CONFIG" ]]; then
        [[ -z "$CONTEXT7_API_KEY" ]] && CONTEXT7_API_KEY=$(grep -A2 '\[mcp_servers.context7.env\]' "$CODEX_CONFIG" 2>/dev/null | grep 'CONTEXT7_API_KEY' | cut -d'"' -f2 || echo "")
        [[ -z "$EXA_API_KEY" ]] && EXA_API_KEY=$(grep -A2 '\[mcp_servers.exa.env\]' "$CODEX_CONFIG" 2>/dev/null | grep 'EXA_API_KEY' | cut -d'"' -f2 || echo "")
        [[ -z "$MEM0_API_KEY" ]] && MEM0_API_KEY=$(grep -A2 '\[mcp_servers.mem0.env\]' "$CODEX_CONFIG" 2>/dev/null | grep 'MEM0_API_KEY' | cut -d'"' -f2 || echo "")
        [[ -z "$GITHUB_TOKEN" ]] && GITHUB_TOKEN=$(grep -A2 '\[mcp_servers.github.env\]' "$CODEX_CONFIG" 2>/dev/null | grep 'GITHUB_TOKEN' | cut -d'"' -f2 || echo "")
    fi

    # Detect uvx path
    local UVX_PATH=""
    if command -v uvx &>/dev/null; then
        UVX_PATH=$(command -v uvx)
    elif [[ -x "${LOCAL_BIN}/uvx" ]]; then
        UVX_PATH="${LOCAL_BIN}/uvx"
    fi

    # Generate config
    _generate_codex_config "$CODEX_CONFIG" "$UVX_PATH" "$CONTEXT7_API_KEY" "$EXA_API_KEY" "$MEM0_API_KEY" "$GITHUB_TOKEN"

    # Count configured servers
    local MCP_COUNT
    MCP_COUNT=$(grep -c '^\[mcp_servers\.' "$CODEX_CONFIG" 2>/dev/null || echo "0")

    stop_spinner "ok" "Codex CLI configured (${MCP_COUNT} MCP servers)"
    log_success "Codex CLI configured with ${MCP_COUNT} MCP servers"
    return 0
}

# Generate complete Codex CLI configuration
# Params: config_path, uvx_path, context7_key, exa_key, mem0_key, github_token
# Output: Complete ~/.codex/config.toml matching Claude Code configuration
_generate_codex_config() {
    local config_path="$1"
    local uvx_path="$2"
    local context7_key="$3"
    local exa_key="$4"
    local mem0_key="$5"
    local github_token="$6"

    cat > "$config_path" << TOML
# ============================================================================
# Codex CLI Configuration - Generated by Flynn Installer v${FLYNN_VERSION}
# ============================================================================
# Identical MCP server configuration as Claude Code for seamless compatibility
# All 11 MCP servers configured: flynn, context7, exa, sequential-thinking,
# mem0, serena, filesystem, git, puppeteer, docker, github
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# ============================================================================

# Model Configuration
model = "gpt-5.1-codex-max"
model_reasoning_effort = "xhigh"

# ============================================================================
# Security & Permissions - Identical to Claude Code behavior
# ============================================================================

# Sandbox: Allow full filesystem and network access (like Claude Code)
sandbox_mode = "off"

# Approval: Only ask on untrusted/risky operations (like Claude Code)
approval_policy = "untrusted"

# ============================================================================
# Trust Levels - No permission prompts for trusted directories
# ============================================================================

[projects."/home"]
trust_level = "trusted"

[projects."${HOME}"]
trust_level = "trusted"

[projects."${HOME}/projects"]
trust_level = "trusted"

# ============================================================================
# MCP Servers - Full Stack AI Development Tools
# ============================================================================

# Flynn - AI Agent Orchestrator
[mcp_servers.flynn]
type = "stdio"
command = "node"
args = ["${FLYNN_MCP_SERVER_PATH}"]

# Context7 - Library Documentation
[mcp_servers.context7]
type = "stdio"
command = "npx"
args = ["-y", "@upstash/context7-mcp"]

TOML

    if [[ -n "$context7_key" ]]; then
        cat >> "$config_path" << TOML
[mcp_servers.context7.env]
CONTEXT7_API_KEY = "${context7_key}"

TOML
    fi

    cat >> "$config_path" << TOML
# Exa - Web Search & Research
[mcp_servers.exa]
type = "stdio"
command = "npx"
args = ["-y", "exa-mcp-server", "tools=web_search_exa,deep_search_exa,get_code_context_exa,crawling_exa,deep_researcher_start,deep_researcher_check"]

TOML

    if [[ -n "$exa_key" ]]; then
        cat >> "$config_path" << TOML
[mcp_servers.exa.env]
EXA_API_KEY = "${exa_key}"

TOML
    fi

    cat >> "$config_path" << TOML
# Sequential Thinking - Structured Problem Solving
[mcp_servers.sequentialthinking-tools]
type = "stdio"
command = "npx"
args = ["-y", "mcp-sequentialthinking-tools"]

[mcp_servers.sequentialthinking-tools.env]
MAX_HISTORY_SIZE = "1000"

TOML

    # Add Python-based servers if uvx is available
    if [[ -n "$uvx_path" ]]; then
        cat >> "$config_path" << TOML
# Mem0 - Persistent Memory
[mcp_servers.mem0]
type = "stdio"
startup_timeout_sec = 30
command = "${uvx_path}"
args = ["mem0-mcp-server"]

TOML

        if [[ -n "$mem0_key" ]]; then
            cat >> "$config_path" << TOML
[mcp_servers.mem0.env]
MEM0_API_KEY = "${mem0_key}"

TOML
        fi

        cat >> "$config_path" << TOML
# Serena - Semantic Code Analysis
[mcp_servers.serena]
type = "stdio"
command = "${uvx_path}"
args = ["--from", "git+https://github.com/oraios/serena", "serena", "start-mcp-server"]

TOML
    fi

    cat >> "$config_path" << TOML
# Filesystem - File Operations
[mcp_servers.filesystem]
type = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "${HOME}"]

# Git - Version Control
[mcp_servers.git]
type = "stdio"
command = "npx"
args = ["-y", "@cyanheads/git-mcp-server"]

# Puppeteer - Browser Automation
[mcp_servers.puppeteer]
type = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-puppeteer"]

# Docker - Container Management
[mcp_servers.docker]
type = "stdio"
command = "npx"
args = ["-y", "@zcaceres/server-docker"]

TOML

    # Add GitHub server only if GITHUB_TOKEN is set
    if [[ -n "$github_token" ]]; then
        cat >> "$config_path" << TOML
# GitHub - Repository Management
[mcp_servers.github]
type = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]

[mcp_servers.github.env]
GITHUB_TOKEN = "${github_token}"

TOML
    else
        cat >> "$config_path" << TOML
# GitHub - Repository Management (disabled: GITHUB_TOKEN not set)
# [mcp_servers.github]
# type = "stdio"
# command = "npx"
# args = ["-y", "@modelcontextprotocol/server-github"]

TOML
    fi

    cat >> "$config_path" << TOML
# ============================================================================
# UI Settings
# ============================================================================

[notice]
hide_full_access_warning = true
TOML
}

# ─────────────────────────────────────────────────────────────────────────────
# Migration
# ─────────────────────────────────────────────────────────────────────────────

migrate_old_installations() {
    start_spinner "Checking legacy Flynn configuration..."

    if [[ "${DRY_RUN:-false}" == true ]]; then
        stop_spinner "skip" "Would migrate existing Flynn configuration"
        return 0
    fi

    if [[ ! -f "$CLAUDE_JSON" ]]; then
        stop_spinner "skip" "No existing Claude config to migrate"
        return 0
    fi

    if ! command -v node &> /dev/null; then
        stop_spinner "warn" "Node.js not available for migration"
        log_warn "Node.js missing - cannot migrate legacy configuration"
        return 1
    fi

    local result=""
    local status=0
    result=$(
        CONFIG_PATH="$CLAUDE_JSON" TARGET_PATH="$FLYNN_MCP_SERVER_PATH" node - 2>&1 <<'EOF'
const fs = require('fs');

const configPath = process.env.CONFIG_PATH;
const targetPath = process.env.TARGET_PATH;

try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const config = raw.trim() ? JSON.parse(raw) : {};

    if (!config.mcpServers || !config.mcpServers.flynn) {
        console.log('noop');
        process.exit(0);
    }

    const server = config.mcpServers.flynn;
    const currentPath = Array.isArray(server.args) && server.args.length > 0 ? server.args[0] : '';
    const needsUpdate = currentPath !== targetPath || !fs.existsSync(currentPath);

    server.type = 'stdio';
    server.command = 'node';
    server.args = [targetPath];

    if (needsUpdate) {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log('updated');
    } else {
        console.log('noop');
    }
} catch (err) {
    console.error(`error:${err.message}`);
    process.exit(1);
}
EOF
    ) || status=$?

    if [[ $status -ne 0 ]]; then
        stop_spinner "warn" "Migration failed (check ${CLAUDE_JSON})"
        log_error "Legacy migration failed: ${result:-no output}"
        return 1
    fi

    if [[ "$result" == "updated" ]]; then
        stop_spinner "ok" "Migrated legacy MCP server path"
        log_info "Updated MCP server path in ${CLAUDE_JSON}"
    else
        stop_spinner "ok" "Legacy configuration already up to date"
    fi

    return 0
}

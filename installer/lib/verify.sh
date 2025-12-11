#!/usr/bin/env bash
# ============================================================================
# Module: lib/verify.sh
# Description: Installation verification and health checks
# Author: Flynn Project
# Version: 2.0.0
# Dependencies: config/constants.sh, lib/common.sh, lib/environment.sh
# ============================================================================
# Source: Google Bash Style Guide, Cursor Rules 2025
# Pattern: Template Method - Standardized verification process
# ============================================================================

# Prevent multiple sourcing
[[ -n "${_VERIFY_SOURCED:-}" ]] && return 0
readonly _VERIFY_SOURCED=1

# ─────────────────────────────────────────────────────────────────────────────
# Basic Verification
# ─────────────────────────────────────────────────────────────────────────────

verify_installation() {
    local errors=0
    local mcp_registered=false

    echo ""
    echo -e "  ${BOLD}Verifying Installation${NC}"
    echo ""

    # Check Flynn directory
    if [[ -d "$FLYNN_DIR" ]]; then
        print_done "Flynn directory exists"
    else
        print_fail "Flynn directory not found"
        errors=$((errors + 1))
    fi

    # Check MCP server
    if [[ -f "$CLAUDE_JSON" ]] && grep -q "flynn" "$CLAUDE_JSON" 2>/dev/null; then
        print_done "MCP server registered"
        mcp_registered=true
    else
        print_fail "MCP server not registered"
        errors=$((errors + 1))
    fi

    # Check MCP server path
    if [[ "$mcp_registered" == true ]]; then
        _verify_mcp_server_path errors
    fi

    # Check permissions
    if [[ -f "$CLAUDE_SETTINGS" ]] && grep -q "mcp__flynn" "$CLAUDE_SETTINGS" 2>/dev/null; then
        print_done "Permissions configured"
    else
        print_fail "Permissions not configured"
        errors=$((errors + 1))
    fi

    # Check slash command
    if [[ -f "$CLAUDE_COMMANDS_DIR/flynn.md" ]]; then
        print_done "/flynn slash command installed"
    else
        print_fail "/flynn slash command not found"
        errors=$((errors + 1))
    fi

    # Check version
    local version
    version=$(get_installed_version)
    if [[ "$version" != "not_installed" && "$version" != "unknown" ]]; then
        print_done "Flynn v${version} installed"
    else
        print_fail "Flynn version unknown"
        errors=$((errors + 1))
    fi

    echo ""

    if [[ $errors -eq 0 ]]; then
        echo -e "  ${GREEN}✓${NC} ${BOLD}Installation verified successfully${NC}"
        log_success "Installation verified: 0 errors"
        return 0
    else
        echo -e "  ${RED}✗${NC} ${BOLD}Installation verification failed: ${errors} error(s)${NC}"
        log_error "Installation verification failed: $errors errors"
        return 1
    fi
}

_verify_mcp_server_path() {
    local -n err_count=$1
    local configured_path=""

    configured_path=$(node -e "
const fs = require('fs');
const configPath = '$CLAUDE_JSON';

try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const args = config?.mcpServers?.flynn?.args;
    if (Array.isArray(args) && args.length > 0 && args[0]) {
        console.log(args[0]);
    }
} catch (e) {}
" 2>/dev/null || true)

    if [[ ! -f "$FLYNN_MCP_SERVER_PATH" ]]; then
        print_fail "MCP server binary missing (${FLYNN_MCP_SERVER_PATH})"
        err_count=$((err_count + 1))
    elif [[ -z "$configured_path" ]]; then
        print_fail "MCP server path missing in config"
        err_count=$((err_count + 1))
    elif [[ "$configured_path" != "$FLYNN_MCP_SERVER_PATH" ]]; then
        print_fail "MCP server path outdated (${configured_path})"
        err_count=$((err_count + 1))
    else
        print_done "MCP server path valid"
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
# Detailed Verification
# ─────────────────────────────────────────────────────────────────────────────

verify_detailed() {
    echo ""
    echo -e "  ${BOLD}=== MCP Server Detailed Verification ===${NC}"
    echo ""

    _verify_environment_variables
    _verify_configuration_files
    _verify_expected_mcp_servers
    _verify_package_runners
    _verify_flynn_server

    echo -e "  ${BOLD}=== Verification Complete ===${NC}"
    echo ""
    echo -e "  ${DIM}To test in Claude Code:${NC}"
    echo -e "    ${CYAN}/flynn list-mcp-tools${NC}"
    echo ""
}

_verify_environment_variables() {
    echo -e "  ${BOLD}1. Environment Variables${NC}"
    local env_vars=("CONTEXT7_API_KEY" "EXA_API_KEY" "MEM0_API_KEY" "GITHUB_TOKEN" "ANTHROPIC_API_KEY")

    for var in "${env_vars[@]}"; do
        local value="${!var:-}"
        if [[ -n "$value" ]]; then
            echo -e "     ${GREEN}✓${NC} $var: ${value:0:10}***"
        else
            echo -e "     ${YELLOW}!${NC} $var: ${DIM}not set${NC}"
        fi
    done
    echo ""
}

_verify_configuration_files() {
    echo -e "  ${BOLD}2. Configuration Files${NC}"

    if [[ -f "$CLAUDE_JSON" ]]; then
        local global_count
        global_count=$(node -e "
const fs = require('fs');
try {
    const config = JSON.parse(fs.readFileSync('$CLAUDE_JSON', 'utf8'));
    console.log(Object.keys(config.mcpServers || {}).length);
} catch (e) { console.log('0'); }
" 2>/dev/null || echo "0")
        echo -e "     ${GREEN}✓${NC} Global config ($CLAUDE_JSON): ${global_count} servers"
    else
        echo -e "     ${YELLOW}!${NC} Global config not found"
    fi

    if [[ -f "$CLAUDE_SETTINGS" ]]; then
        local perms_count
        perms_count=$(node -e "
const fs = require('fs');
try {
    const config = JSON.parse(fs.readFileSync('$CLAUDE_SETTINGS', 'utf8'));
    console.log((config.permissions?.allow || []).length);
} catch (e) { console.log('0'); }
" 2>/dev/null || echo "0")
        echo -e "     ${GREEN}✓${NC} Settings ($CLAUDE_SETTINGS): ${perms_count} permissions"
    else
        echo -e "     ${YELLOW}!${NC} Settings not found"
    fi

    # Codex config
    local CODEX_CONFIG="${HOME}/.codex/config.toml"
    if [[ -f "$CODEX_CONFIG" ]]; then
        local codex_count
        codex_count=$(grep -c '^\[mcp_servers\.' "$CODEX_CONFIG" 2>/dev/null || echo "0")
        echo -e "     ${GREEN}✓${NC} Codex config ($CODEX_CONFIG): ${codex_count} servers"
    else
        echo -e "     ${DIM}○${NC} Codex config not found (optional)"
    fi
    echo ""
}

_verify_expected_mcp_servers() {
    echo -e "  ${BOLD}3. Expected MCP Servers (${#EXPECTED_MCP_SERVERS[@]} total)${NC}"

    for server in "${EXPECTED_MCP_SERVERS[@]}"; do
        if [[ -f "$CLAUDE_JSON" ]] && grep -q "\"$server\"" "$CLAUDE_JSON" 2>/dev/null; then
            echo -e "     ${GREEN}✓${NC} $server"
        else
            echo -e "     ${DIM}○${NC} $server ${DIM}(not configured)${NC}"
        fi
    done
    echo ""
}

_verify_package_runners() {
    echo -e "  ${BOLD}4. Package Runners${NC}"

    for cmd in npx uvx node pnpm; do
        if command -v "$cmd" &>/dev/null; then
            local ver
            ver=$($cmd --version 2>/dev/null | head -1)
            echo -e "     ${GREEN}✓${NC} $cmd: $ver"
        else
            echo -e "     ${RED}✗${NC} $cmd: NOT FOUND"
        fi
    done
    echo ""
}

_verify_flynn_server() {
    echo -e "  ${BOLD}5. Flynn Server${NC}"

    if [[ -f "$FLYNN_MCP_SERVER_PATH" ]]; then
        echo -e "     ${GREEN}✓${NC} server.js exists"
    else
        echo -e "     ${RED}✗${NC} server.js NOT FOUND"
    fi
    echo ""
}

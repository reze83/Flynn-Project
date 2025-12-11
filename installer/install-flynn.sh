#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Flynn Enhanced Installer v2.0 (Modular)
# ═══════════════════════════════════════════════════════════════════════════
#
# A robust, user-local installation system for Flynn AI Agent Orchestrator
# Refactored using Google Bash Style Guide and Cursor Rules 2025
#
# Features:
#   • Modular architecture with separate library files
#   • Multiple operation modes (install/update/uninstall/verify)
#   • Comprehensive error handling with automatic rollback
#   • Detailed logging with rotation
#   • Offline installation support
#   • Post-install health verification
#   • XDG-compliant paths
#   • Zero sudo required (except for system packages)
#
# Usage:
#   ./install-flynn.sh [OPTIONS]
#
# Options:
#   --install          Fresh installation (default)
#   --update           Update existing installation
#   --uninstall        Remove Flynn completely
#   --verify           Health check of installation
#   --minimal          Node.js + pnpm only
#   --full             Include Python/ML tools (default)
#   --offline          Use cached packages
#   --non-interactive  No prompts (for CI/CD)
#   --dry-run          Show actions without executing
#   --debug            Verbose output
#   --keep-config      Preserve config during uninstall
#   --help             Show this help
#
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# Script Directory Detection
# ─────────────────────────────────────────────────────────────────────────────

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ─────────────────────────────────────────────────────────────────────────────
# Source Modules
# ─────────────────────────────────────────────────────────────────────────────

# shellcheck source=config/constants.sh
source "${SCRIPT_DIR}/config/constants.sh"

# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"

# shellcheck source=lib/environment.sh
source "${SCRIPT_DIR}/lib/environment.sh"

# shellcheck source=lib/prerequisites.sh
source "${SCRIPT_DIR}/lib/prerequisites.sh"

# shellcheck source=lib/installers.sh
source "${SCRIPT_DIR}/lib/installers.sh"

# shellcheck source=lib/config.sh
source "${SCRIPT_DIR}/lib/config.sh"

# shellcheck source=lib/rollback.sh
source "${SCRIPT_DIR}/lib/rollback.sh"

# shellcheck source=lib/verify.sh
source "${SCRIPT_DIR}/lib/verify.sh"

# ─────────────────────────────────────────────────────────────────────────────
# Global State
# ─────────────────────────────────────────────────────────────────────────────

OPERATION_MODE="install"
INSTALL_MODE="full"
DRY_RUN=false
DEBUG=false
NON_INTERACTIVE=false
OFFLINE=false
KEEP_CONFIG=false
WITH_PUPPETEER=true
WITH_CODEX=true
VERIFY_DETAILED=true

# ─────────────────────────────────────────────────────────────────────────────
# Operation Modes
# ─────────────────────────────────────────────────────────────────────────────

mode_install() {
    print_header

    local current_version
    current_version=$(get_installed_version)

    if [[ "$current_version" != "not_installed" ]]; then
        echo -e "  ${YELLOW}!${NC} Flynn is already installed (v${current_version})"
        echo ""
        if [[ "$NON_INTERACTIVE" == false ]]; then
            echo -ne "  Reinstall? [y/N]: "
            read -r response
            if [[ ! "$response" =~ ^[Yy]$ ]]; then
                echo -e "  ${DIM}Installation cancelled${NC}"
                exit 0
            fi
        else
            log_info "Reinstalling over existing installation"
        fi
        echo ""
    fi

    local os
    os=$(detect_os)
    echo -e "  ${DIM}System: $os${NC}"
    echo ""

    # Create initial rollback point
    create_rollback_point "pre_install"

    # Check git
    if ! check_git; then
        print_fail "Git not found"
        echo ""
        echo -e "  ${DIM}Install Git first:${NC}"
        case "$os" in
            linux|wsl) echo -e "    ${CYAN}sudo apt install git${NC}" ;;
            macos) echo -e "    ${CYAN}xcode-select --install${NC}" ;;
        esac
        echo ""
        exit 1
    fi
    print_done "Git $(git --version | cut -d' ' -f3)"

    echo ""

    # Setup paths
    ensure_local_bin_in_path

    # Determine steps (Node.js, Python, Claude Code, Codex CLI, External MCP, Flynn, API Keys, Config, Puppeteer)
    local total_steps=9
    [[ "$INSTALL_MODE" == "full" ]] && total_steps=10
    [[ "$WITH_PUPPETEER" == false ]] && ((total_steps--))
    local current_step=1

    # Step 1: Node.js
    print_step "$current_step" "$total_steps" "Node.js Runtime"
    ((current_step++))

    if ! check_fnm; then
        install_fnm || { execute_rollback "fnm installation failed"; exit 1; }
    else
        print_done "fnm $(fnm --version 2>/dev/null | cut -d' ' -f2)"
    fi

    export PATH="$LOCAL_SHARE/fnm:$LOCAL_BIN:$PATH"
    eval "$(fnm env 2>/dev/null)" || true

    if ! check_node; then
        install_node || { execute_rollback "Node.js installation failed"; exit 1; }
    else
        print_done "Node.js $(node -v)"
    fi

    if ! check_pnpm; then
        install_pnpm || { execute_rollback "pnpm installation failed"; exit 1; }
    else
        print_done "pnpm v$(pnpm -v)"
    fi

    # Step 2: Python (full mode)
    if [[ "$INSTALL_MODE" == "full" ]]; then
        print_step "$current_step" "$total_steps" "Python Runtime"
        ((current_step++))

        if ! check_uv; then
            install_uv || log_warn "uv installation failed (optional)"
        else
            print_done "uv $(uv --version 2>/dev/null | cut -d' ' -f2)"
        fi

        if ! check_python; then
            install_python || log_warn "Python installation failed (optional)"
        else
            local pyver
            pyver=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
            print_done "Python $pyver"
        fi
    fi

    # Step 3: Claude Code
    print_step "$current_step" "$total_steps" "Claude Code"
    ((current_step++))

    if ! check_claude_code; then
        install_claude_code || { execute_rollback "Claude Code installation failed"; exit 1; }
    else
        print_done "Claude Code $(claude --version 2>/dev/null)"
    fi

    # Step 4: Codex CLI (OpenAI)
    print_step "$current_step" "$total_steps" "Codex CLI"
    ((current_step++))

    if [[ "$WITH_CODEX" == false ]]; then
        print_done "Codex CLI skipped (--without-codex)"
    elif ! check_codex_cli; then
        install_codex_cli || log_warn "Codex CLI installation failed (optional)"
    else
        print_done "Codex CLI $(codex --version 2>/dev/null | head -1)"
    fi

    # Step 5: External MCP Servers
    print_step "$current_step" "$total_steps" "External MCP Servers"
    ((current_step++))

    install_external_mcp_servers || log_warn "Some external MCP servers failed to install"

    # Step 6: Flynn Packages
    print_step "$current_step" "$total_steps" "Flynn Packages"
    ((current_step++))

    install_flynn_packages || { execute_rollback "Flynn package installation failed"; exit 1; }

    # Step 7: API Keys (Interactive)
    print_step "$current_step" "$total_steps" "API Keys Setup"
    ((current_step++))

    prompt_api_keys

    # Step 8: Configuration
    print_step "$current_step" "$total_steps" "Configuration"
    ((current_step++))

    migrate_old_installations || log_warn "Migration step completed with warnings"
    configure_flynn || { execute_rollback "Flynn configuration failed"; exit 1; }

    # Optional: Puppeteer dependencies
    if [[ "$WITH_PUPPETEER" == true ]]; then
        print_step "$current_step" "$total_steps" "Puppeteer Dependencies"
        ((current_step++))
        install_puppeteer_deps || log_warn "Puppeteer dependencies installation failed (optional)"
        verify_puppeteer || true
    fi

    # Final step: Verification
    print_step "$current_step" "$total_steps" "Verification"

    if ! verify_installation; then
        echo ""
        echo -e "  ${YELLOW}!${NC} Installation completed with warnings"
        echo -e "  ${DIM}Check log: ${FLYNN_LOG_FILE}${NC}"
    fi

    # Cleanup old rollback points
    cleanup_rollback_points

    # Success
    echo ""
    echo -e "  ${GREEN}${BOLD}✓ Flynn installed successfully!${NC}"
    echo ""
    echo -e "  ${DIM}Installation:${NC}  ${CYAN}${FLYNN_DIR}${NC}"
    echo -e "  ${DIM}Version:${NC}       ${CYAN}v$(get_installed_version)${NC}"
    echo -e "  ${DIM}Log file:${NC}      ${CYAN}${FLYNN_LOG_FILE}${NC}"
    if command -v codex &>/dev/null; then
        echo -e "  ${DIM}Codex config:${NC}  ${CYAN}~/.codex/config.toml${NC}"
    fi
    echo ""
    echo -e "  ${BOLD}Next Steps:${NC}"
    echo -e "    1. Restart your terminal or run: ${CYAN}source $(get_shell_rc)${NC}"
    echo -e "    2. Set API keys (if needed):"
    if command -v codex &>/dev/null; then
        echo -e "       ${CYAN}export OPENAI_API_KEY=\"your-key\"${NC}"
    fi
    echo -e "    3. Restart Claude Code"
    echo -e "    4. Try: ${CYAN}/flynn${NC} or ${CYAN}mcp__flynn__list-workflows${NC}"
    if command -v codex &>/dev/null; then
        echo -e "    5. Verify Codex: ${CYAN}codex mcp list${NC}"
        echo -e "    6. Or run: ${CYAN}codex --help${NC}"
    fi
    echo ""
}

mode_update() {
    print_header

    local current_version
    current_version=$(get_installed_version)

    if [[ "$current_version" == "not_installed" ]]; then
        echo -e "  ${RED}✗${NC} Flynn is not installed"
        echo ""
        echo -e "  ${DIM}Run installation instead:${NC}"
        echo -e "    ${CYAN}$0 --install${NC}"
        echo ""
        exit 1
    fi

    echo -e "  ${DIM}Current version: v${current_version}${NC}"
    echo -e "  ${DIM}Target version:  v${FLYNN_VERSION}${NC}"
    echo ""

    version_compare "$current_version" "$FLYNN_VERSION"
    local cmp=$?

    if [[ $cmp -eq 0 ]]; then
        migrate_old_installations || log_warn "Migration step completed with warnings"
        echo -e "  ${GREEN}✓${NC} Already up to date"
        exit 0
    fi

    if [[ $cmp -eq 1 ]]; then
        echo -e "  ${YELLOW}!${NC} Installed version is newer than installer"
        if [[ "$NON_INTERACTIVE" == false ]]; then
            echo -ne "  Continue anyway? [y/N]: "
            read -r response
            if [[ ! "$response" =~ ^[Yy]$ ]]; then
                exit 0
            fi
        fi
    fi

    # Create rollback point
    create_rollback_point "pre_update_${current_version}"

    migrate_old_installations || log_warn "Migration step completed with warnings"

    echo -e "  ${BOLD}Updating Flynn...${NC}"
    echo ""

    # Update repository
    start_spinner "Updating repository..."

    if [[ "$DRY_RUN" == false ]]; then
        if [[ -d "$FLYNN_DIR/.git" ]]; then
            if (cd "$FLYNN_DIR" && git fetch origin main > /dev/null 2>&1 && git reset --hard origin/main > /dev/null 2>&1); then
                stop_spinner "ok" "Repository updated"
            else
                stop_spinner "fail" "Failed to update repository"
                execute_rollback "Repository update failed"
                exit 1
            fi
        else
            stop_spinner "warn" "Not a git repository, reinstalling..."
            rm -rf "$FLYNN_DIR"
            if ! git clone --depth 1 https://github.com/reze83/Flynn-Project.git "$FLYNN_DIR" > /dev/null 2>&1; then
                stop_spinner "fail" "Failed to clone repository"
                execute_rollback "Repository clone failed"
                exit 1
            fi
        fi
    else
        stop_spinner "skip" "Would update repository"
    fi

    # Reinstall dependencies
    start_spinner "Updating dependencies..."

    if [[ "$DRY_RUN" == false ]]; then
        if (cd "$FLYNN_DIR" && pnpm install > /dev/null 2>&1); then
            stop_spinner "ok" "Dependencies updated"
        else
            stop_spinner "fail" "Failed to update dependencies"
            execute_rollback "Dependency update failed"
            exit 1
        fi
    else
        stop_spinner "skip" "Would update dependencies"
    fi

    # Rebuild
    start_spinner "Rebuilding packages..."

    if [[ "$DRY_RUN" == false ]]; then
        if (cd "$FLYNN_DIR" && pnpm build > /dev/null 2>&1); then
            stop_spinner "ok" "Packages rebuilt"
        else
            stop_spinner "fail" "Failed to rebuild packages"
            execute_rollback "Build failed"
            exit 1
        fi
    else
        stop_spinner "skip" "Would rebuild packages"
    fi

    # Reconfigure
    start_spinner "Updating configuration..."

    if [[ "$DRY_RUN" == false ]]; then
        configure_flynn || {
            stop_spinner "fail" "Configuration update failed"
            execute_rollback "Configuration failed"
            exit 1
        }
    else
        stop_spinner "skip" "Would update configuration"
    fi

    # Verify
    if [[ "$DRY_RUN" == false ]]; then
        echo ""
        verify_installation || true
    fi

    # Cleanup
    cleanup_rollback_points

    echo ""
    echo -e "  ${GREEN}${BOLD}✓ Flynn updated successfully!${NC}"
    echo ""
    echo -e "  ${DIM}Previous:${NC} v${current_version}"
    echo -e "  ${DIM}Current:${NC}  v$(get_installed_version)"
    echo ""
    echo -e "  ${BOLD}Next:${NC} Restart Claude Code to apply changes"
    echo ""
}

mode_uninstall() {
    print_header

    if [[ "$(get_installed_version)" == "not_installed" ]]; then
        echo -e "  ${DIM}Flynn is not installed${NC}"
        exit 0
    fi

    echo -e "  ${YELLOW}!${NC} ${BOLD}This will remove Flynn completely${NC}"
    echo ""

    if [[ "$KEEP_CONFIG" == true ]]; then
        echo -e "  ${DIM}Configuration will be preserved${NC}"
    else
        echo -e "  ${DIM}The following will be removed:${NC}"
        echo -e "    • ${FLYNN_DIR}"
        echo -e "    • MCP server registration"
        echo -e "    • Tool permissions"
        echo -e "    • /flynn slash command"
    fi

    echo ""

    if [[ "$NON_INTERACTIVE" == false ]]; then
        echo -ne "  Continue? [y/N]: "
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            echo -e "  ${DIM}Uninstall cancelled${NC}"
            exit 0
        fi
        echo ""
    fi

    # Create backup before uninstall
    create_rollback_point "pre_uninstall"

    # Remove Flynn directory
    start_spinner "Removing Flynn directory..."
    if [[ "$DRY_RUN" == false ]]; then
        rm -rf "$FLYNN_DIR"
        stop_spinner "ok" "Flynn directory removed"
    else
        stop_spinner "skip" "Would remove Flynn directory"
    fi

    # Remove MCP server registration
    if [[ "$KEEP_CONFIG" == false ]]; then
        start_spinner "Removing MCP server registration..."

        if [[ "$DRY_RUN" == false && -f "$CLAUDE_JSON" ]]; then
            node -e "
const fs = require('fs');
const configPath = '$CLAUDE_JSON';

try {
    let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.mcpServers && config.mcpServers.flynn) {
        delete config.mcpServers.flynn;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }
} catch (e) {}
" 2>/dev/null
            stop_spinner "ok" "MCP server registration removed"
        else
            stop_spinner "skip" "Would remove MCP server registration"
        fi

        # Remove permissions
        start_spinner "Removing tool permissions..."

        if [[ "$DRY_RUN" == false && -f "$CLAUDE_SETTINGS" ]]; then
            node -e "
const fs = require('fs');
const settingsPath = '$CLAUDE_SETTINGS';

try {
    let config = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    if (config.permissions && config.permissions.allow) {
        config.permissions.allow = config.permissions.allow.filter(tool => !tool.startsWith('mcp__flynn__'));
        fs.writeFileSync(settingsPath, JSON.stringify(config, null, 2));
    }
} catch (e) {}
" 2>/dev/null
            stop_spinner "ok" "Tool permissions removed"
        else
            stop_spinner "skip" "Would remove tool permissions"
        fi

        # Remove slash command
        start_spinner "Removing /flynn slash command..."

        if [[ "$DRY_RUN" == false && -f "$CLAUDE_COMMANDS_DIR/flynn.md" ]]; then
            rm -f "$CLAUDE_COMMANDS_DIR/flynn.md"
            stop_spinner "ok" "/flynn slash command removed"
        else
            stop_spinner "skip" "Would remove /flynn slash command"
        fi
    fi

    echo ""
    echo -e "  ${GREEN}✓${NC} ${BOLD}Flynn uninstalled${NC}"
    echo ""

    if [[ "$KEEP_CONFIG" == true ]]; then
        echo -e "  ${DIM}Configuration preserved in:${NC}"
        echo -e "    • ${CLAUDE_JSON}"
        echo -e "    • ${CLAUDE_SETTINGS}"
        echo ""
    fi

    echo -e "  ${DIM}Logs and backups preserved in: ${FLYNN_LOG_DIR}${NC}"
    echo ""
}

mode_verify() {
    print_header

    if [[ "$(get_installed_version)" == "not_installed" ]]; then
        echo -e "  ${RED}✗${NC} Flynn is not installed"
        exit 1
    fi

    # Verify installation (don't exit on verification failures)
    local verify_result=0
    verify_installation || verify_result=$?

    # Optional detailed verification
    if [[ "$VERIFY_DETAILED" == true ]]; then
        verify_detailed
    fi

    echo ""
    echo -e "  ${DIM}For detailed logs, see: ${FLYNN_LOG_FILE}${NC}"
    echo ""

    # Return the verification result
    return $verify_result
}

# ─────────────────────────────────────────────────────────────────────────────
# Help
# ─────────────────────────────────────────────────────────────────────────────

show_help() {
    cat << EOF

${BOLD}Flynn Enhanced Installer v${FLYNN_VERSION} (Modular)${NC}

AI Agent Orchestrator + Codex CLI for Claude Code & OpenAI Codex

${BOLD}USAGE:${NC}
    $0 [OPTIONS]

${BOLD}OPERATION MODES:${NC}
    --install          Fresh installation (default)
    --update           Update existing installation
    --uninstall        Remove Flynn completely
    --verify           Health check of installation

${BOLD}INSTALLATION OPTIONS:${NC}
    --minimal          Node.js + pnpm only
    --full             Include Python/ML tools (default)
    --without-puppeteer  Skip Puppeteer/Chrome system dependencies
    --without-codex    Skip Codex CLI installation
    --offline          Use cached packages
    --non-interactive  No prompts (for CI/CD)
    --dry-run          Show actions without executing
    --debug            Verbose output

${BOLD}VERIFICATION OPTIONS:${NC}
    --verify-basic     Skip detailed MCP server checks

${BOLD}UNINSTALL OPTIONS:${NC}
    --keep-config      Preserve configuration during uninstall

${BOLD}GENERAL OPTIONS:${NC}
    --help             Show this help

${BOLD}EXAMPLES:${NC}
    # Fresh installation
    $0

    # Minimal installation
    $0 --install --minimal

    # Update to latest version
    $0 --update

    # Verify installation
    $0 --verify

    # Uninstall keeping config
    $0 --uninstall --keep-config

    # Dry run (show what would happen)
    $0 --install --dry-run

${BOLD}INSTALLED TOOLS:${NC}
    • Claude Code (@anthropic-ai/claude-code)
    • Codex CLI (@openai/codex) - Optional AI coding assistant
    • Flynn MCP Server (AI agent orchestrator)
    • 10 External MCP Servers (serena, exa, context7, etc.)

${BOLD}MODULE STRUCTURE:${NC}
    installer/
    ├── install-flynn.sh      # Main script
    ├── config/
    │   └── constants.sh      # Constants and arrays
    └── lib/
        ├── common.sh         # Logging and output
        ├── environment.sh    # OS/shell detection
        ├── prerequisites.sh  # Dependency checks
        ├── installers.sh     # Installation functions
        ├── config.sh         # Flynn configuration
        ├── rollback.sh       # Rollback system
        └── verify.sh         # Verification

${BOLD}MORE INFO:${NC}
    GitHub: https://github.com/reze83/Flynn-Project
    Docs:   https://github.com/reze83/Flynn-Project/tree/main/docs

EOF
}

# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

main() {
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --install)
                OPERATION_MODE="install"
                ;;
            --update)
                OPERATION_MODE="update"
                ;;
            --uninstall)
                OPERATION_MODE="uninstall"
                ;;
            --verify)
                OPERATION_MODE="verify"
                ;;
            --minimal)
                INSTALL_MODE="minimal"
                ;;
            --full)
                INSTALL_MODE="full"
                ;;
            --offline)
                OFFLINE=true
                ;;
            --non-interactive)
                NON_INTERACTIVE=true
                ;;
            --dry-run)
                DRY_RUN=true
                ;;
            --debug)
                DEBUG=true
                ;;
            --keep-config)
                KEEP_CONFIG=true
                ;;
            --without-puppeteer)
                WITH_PUPPETEER=false
                ;;
            --without-codex)
                WITH_CODEX=false
                ;;
            --verify-basic)
                VERIFY_DETAILED=false
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                echo "Run '$0 --help' for usage"
                exit 1
                ;;
        esac
        shift
    done

    # Setup logging
    setup_logging

    # Execute operation
    # Note: verify mode may return non-zero if there are issues, which is expected
    local exit_code=0
    case "$OPERATION_MODE" in
        install)
            mode_install
            ;;
        update)
            mode_update
            ;;
        uninstall)
            mode_uninstall
            ;;
        verify)
            mode_verify || exit_code=$?
            ;;
        *)
            echo "Invalid operation mode: $OPERATION_MODE"
            exit 1
            ;;
    esac

    exit $exit_code
}

# ─────────────────────────────────────────────────────────────────────────────
# Error Handling and Cleanup
# ─────────────────────────────────────────────────────────────────────────────

# Global error handler with stack trace
error_handler() {
    local exit_code=$?
    local line_number=$1
    local command="$2"

    # Stop any running spinner
    if [[ -n "${SPINNER_PID:-}" ]]; then
        kill "$SPINNER_PID" 2>/dev/null || true
        wait "$SPINNER_PID" 2>/dev/null || true
        SPINNER_PID=""
    fi

    echo "" >&2
    echo -e "  ${RED}╭─────────────────────────────────────────────────────────────╮${NC}" >&2
    echo -e "  ${RED}│${NC} ${BOLD}Installation Error${NC}                                         ${RED}│${NC}" >&2
    echo -e "  ${RED}╰─────────────────────────────────────────────────────────────╯${NC}" >&2
    echo "" >&2
    echo -e "  ${RED}✗${NC} Command failed: ${DIM}$command${NC}" >&2
    echo -e "  ${RED}✗${NC} Location: ${DIM}install-flynn.sh:${line_number}${NC}" >&2
    echo -e "  ${RED}✗${NC} Exit code: ${DIM}$exit_code${NC}" >&2
    echo "" >&2

    # Log error details
    log_error "Command '$command' failed at line $line_number with exit code $exit_code"

    # Show stack trace in debug mode
    if [[ "${DEBUG:-false}" == true ]]; then
        echo -e "  ${DIM}Stack trace:${NC}" >&2
        local i=0
        while caller $i 2>/dev/null; do
            ((i++))
        done | while read -r line func file; do
            echo -e "    ${DIM}$file:$line in $func${NC}" >&2
        done
    fi

    # Attempt rollback
    execute_rollback "Installation failed at line $line_number"

    echo "" >&2
    echo -e "  ${DIM}For details, check: ${FLYNN_LOG_FILE}${NC}" >&2
    echo "" >&2

    exit "$exit_code"
}

# Cleanup handler for interrupts (Ctrl+C, SIGTERM)
cleanup_handler() {
    local signal=$1

    # Stop any running spinner
    if [[ -n "${SPINNER_PID:-}" ]]; then
        kill "$SPINNER_PID" 2>/dev/null || true
        wait "$SPINNER_PID" 2>/dev/null || true
        SPINNER_PID=""
    fi

    echo "" >&2
    echo -e "  ${YELLOW}!${NC} Installation interrupted (${signal})" >&2

    log_warn "Installation interrupted by $signal"

    # Offer rollback in interactive mode
    if [[ "${NON_INTERACTIVE:-false}" == false && ${#ROLLBACK_POINTS[@]} -gt 0 ]]; then
        echo -ne "  Rollback changes? [Y/n]: " >&2
        read -r response
        if [[ ! "$response" =~ ^[Nn]$ ]]; then
            execute_rollback "User interrupted installation"
        fi
    fi

    echo "" >&2
    exit 130
}

# Set up traps
trap 'error_handler ${LINENO} "$BASH_COMMAND"' ERR
trap 'cleanup_handler SIGINT' SIGINT
trap 'cleanup_handler SIGTERM' SIGTERM

# Run main
main "$@"

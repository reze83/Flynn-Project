#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════
# Flynn Enhanced Installer v2.0
# ═══════════════════════════════════════════════════════════════════════════
#
# A robust, user-local installation system for Flynn AI Agent Orchestrator
#
# Features:
#   • Multiple operation modes (install/update/uninstall/verify)
#   • Comprehensive error handling with automatic rollback
#   • Detailed logging with rotation
#   • Offline installation support
#   • Post-install health verification
#   • XDG-compliant paths
#   • Zero sudo required
#
# Usage:
#   ./install-flynn.sh [OPTIONS]
#
# Options:
#   --install          Fresh installation (default)
#   --update          Update existing installation
#   --uninstall       Remove Flynn completely
#   --verify          Health check of installation
#   --minimal         Node.js + pnpm only
#   --full            Include Python/ML tools (default)
#   --offline         Use cached packages
#   --non-interactive No prompts (for CI/CD)
#   --dry-run         Show actions without executing
#   --debug           Verbose output
#   --keep-config     Preserve config during uninstall
#   --help            Show this help
#
# Examples:
#   ./install-flynn.sh                    # Fresh full installation
#   ./install-flynn.sh --update           # Update to latest version
#   ./install-flynn.sh --minimal          # Minimal installation
#   ./install-flynn.sh --uninstall        # Clean removal
#   ./install-flynn.sh --verify           # Health check
#
# ═══════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────────────────────

FLYNN_VERSION="2.0.0"
FLYNN_MIN_VERSION="1.0.0"
NODE_VERSION="22"
PYTHON_VERSION="3.11"

# XDG-compliant paths
LOCAL_BIN="${HOME}/.local/bin"
LOCAL_SHARE="${HOME}/.local/share"
FLYNN_DIR="${LOCAL_SHARE}/flynn"
FLYNN_MCP_SERVER_PATH="${FLYNN_DIR}/apps/server/dist/server.js"
FLYNN_CONFIG_DIR="${HOME}/.config/flynn"
FLYNN_LOG_DIR="${HOME}/.flynn"
FLYNN_LOG_FILE="${FLYNN_LOG_DIR}/install.log"
FLYNN_BACKUP_DIR="${FLYNN_LOG_DIR}/backups"

# Claude Code paths
CLAUDE_JSON="${HOME}/.claude.json"
CLAUDE_SETTINGS="${HOME}/.claude/settings.json"
CLAUDE_COMMANDS_DIR="${HOME}/.claude/commands"

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

# Spinner frames
SPINNER_FRAMES=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")
SPINNER_PID=""

# Global state
OPERATION_MODE="install"
INSTALL_MODE="full"
DRY_RUN=false
DEBUG=false
NON_INTERACTIVE=false
OFFLINE=false
KEEP_CONFIG=false
WITH_PUPPETEER=true
VERIFY_DETAILED=true
ROLLBACK_POINTS=()

# Flynn tools for permission configuration
FLYNN_TOOLS=(
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

# External MCP server tools for permission configuration
# These tools are from the 10 external MCP servers Flynn integrates with
EXTERNAL_MCP_TOOLS=(
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
# Logging Functions
# ─────────────────────────────────────────────────────────────────────────────

setup_logging() {
    mkdir -p "$FLYNN_LOG_DIR"

    # Rotate logs (keep last 5)
    if [[ -f "$FLYNN_LOG_FILE" ]]; then
        for i in {4..1}; do
            [[ -f "${FLYNN_LOG_FILE}.$i" ]] && mv "${FLYNN_LOG_FILE}.$i" "${FLYNN_LOG_FILE}.$((i+1))"
        done
        mv "$FLYNN_LOG_FILE" "${FLYNN_LOG_FILE}.1"
    fi

    # Create new log
    touch "$FLYNN_LOG_FILE"
    log_info "Flynn Installer v${FLYNN_VERSION} started"
    log_info "Operation: ${OPERATION_MODE}, Mode: ${INSTALL_MODE}"
    log_info "System: $(uname -s) $(uname -m)"
}

log_action() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${timestamp}] ${level}: ${message}" >> "$FLYNN_LOG_FILE"
    [[ "$DEBUG" == true ]] && echo -e "  ${DIM}[${level}] ${message}${NC}"
}

log_info() { log_action "INFO" "$@"; }
log_step() { log_action "STEP" "$@"; }
log_success() { log_action "SUCCESS" "$@"; }
log_warn() { log_action "WARN" "$@"; }
log_error() { log_action "ERROR" "$@"; }
log_rollback() { log_action "ROLLBACK" "$@"; }

# ─────────────────────────────────────────────────────────────────────────────
# Spinner Functions
# ─────────────────────────────────────────────────────────────────────────────

start_spinner() {
    [[ "$NON_INTERACTIVE" == true ]] && return
    local msg="$1"
    (
        i=0
        while true; do
            printf "\r  ${CYAN}${SPINNER_FRAMES[$i]}${NC} %s" "$msg"
            i=$(( (i + 1) % 10 ))
            sleep 0.08
        done
    ) &
    SPINNER_PID=$!
}

stop_spinner() {
    [[ "$NON_INTERACTIVE" == true ]] && return
    local status="$1"
    local msg="$2"
    [[ -n "$SPINNER_PID" ]] && kill "$SPINNER_PID" 2>/dev/null
    wait "$SPINNER_PID" 2>/dev/null || true
    SPINNER_PID=""

    case "$status" in
        ok)
            printf "\r  ${GREEN}✓${NC} %-60s\n" "$msg"
            log_success "$msg"
            ;;
        warn)
            printf "\r  ${YELLOW}!${NC} %-60s\n" "$msg"
            log_warn "$msg"
            ;;
        skip)
            printf "\r  ${DIM}○${NC} %-60s\n" "$msg"
            log_info "Skipped: $msg"
            ;;
        fail)
            printf "\r  ${RED}✗${NC} %-60s\n" "$msg"
            log_error "$msg"
            ;;
    esac
}

# ─────────────────────────────────────────────────────────────────────────────
# Output Functions
# ─────────────────────────────────────────────────────────────────────────────

print_header() {
    echo ""
    echo -e "  ${BOLD}Flynn Installer${NC} ${DIM}v${FLYNN_VERSION}${NC}"
    echo -e "  ${DIM}AI Agent Orchestrator for Claude Code${NC}"
    echo ""
}

print_step() {
    local current="$1"
    local total="$2"
    local msg="$3"
    echo ""
    echo -e "  ${DIM}[$current/$total]${NC} ${BOLD}$msg${NC}"
    log_step "[$current/$total] $msg"
}

print_done() {
    echo -e "  ${GREEN}✓${NC} $1"
}

print_warn() {
    echo -e "  ${YELLOW}!${NC} $1"
}

print_fail() {
    echo -e "  ${RED}✗${NC} $1"
}

print_info() {
    echo -e "  ${DIM}$1${NC}"
}

# ─────────────────────────────────────────────────────────────────────────────
# Rollback System
# ─────────────────────────────────────────────────────────────────────────────

create_rollback_point() {
    local description="$1"
    local timestamp=$(date +%s)
    local rollback_id="rollback_${timestamp}"

    mkdir -p "${FLYNN_BACKUP_DIR}/${rollback_id}"

    # Backup critical files if they exist
    [[ -f "$CLAUDE_JSON" ]] && cp "$CLAUDE_JSON" "${FLYNN_BACKUP_DIR}/${rollback_id}/"
    [[ -f "$CLAUDE_SETTINGS" ]] && cp "$CLAUDE_SETTINGS" "${FLYNN_BACKUP_DIR}/${rollback_id}/"
    [[ -d "$FLYNN_DIR" ]] && tar -czf "${FLYNN_BACKUP_DIR}/${rollback_id}/flynn_dir.tar.gz" -C "$LOCAL_SHARE" flynn 2>/dev/null || true

    echo "$description" > "${FLYNN_BACKUP_DIR}/${rollback_id}/description.txt"
    ROLLBACK_POINTS+=("$rollback_id")

    log_info "Created rollback point: $rollback_id ($description)"
}

execute_rollback() {
    local reason="$1"
    log_rollback "Initiating rollback: $reason"

    if [[ ${#ROLLBACK_POINTS[@]} -eq 0 ]]; then
        log_warn "No rollback points available"
        return 1
    fi

    local latest="${ROLLBACK_POINTS[-1]}"
    local backup_dir="${FLYNN_BACKUP_DIR}/${latest}"

    if [[ ! -d "$backup_dir" ]]; then
        log_error "Rollback point not found: $latest"
        return 1
    fi

    echo ""
    echo -e "  ${YELLOW}!${NC} ${BOLD}Rolling back changes...${NC}"

    # Restore files
    [[ -f "${backup_dir}/$(basename "$CLAUDE_JSON")" ]] && cp "${backup_dir}/$(basename "$CLAUDE_JSON")" "$CLAUDE_JSON"
    [[ -f "${backup_dir}/$(basename "$CLAUDE_SETTINGS")" ]] && cp "${backup_dir}/$(basename "$CLAUDE_SETTINGS")" "$CLAUDE_SETTINGS"

    if [[ -f "${backup_dir}/flynn_dir.tar.gz" ]]; then
        rm -rf "$FLYNN_DIR"
        tar -xzf "${backup_dir}/flynn_dir.tar.gz" -C "$LOCAL_SHARE" 2>/dev/null || true
    fi

    log_success "Rollback completed"
    echo -e "  ${GREEN}✓${NC} System restored to previous state"
}

cleanup_rollback_points() {
    # Keep only last 3 rollback points
    local backup_dirs=($(ls -dt ${FLYNN_BACKUP_DIR}/rollback_* 2>/dev/null || true))
    if [[ ${#backup_dirs[@]} -gt 3 ]]; then
        for dir in "${backup_dirs[@]:3}"; do
            rm -rf "$dir"
            log_info "Removed old rollback point: $(basename "$dir")"
        done
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
# Environment Detection
# ─────────────────────────────────────────────────────────────────────────────

detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if grep -q Microsoft /proc/version 2>/dev/null; then
            echo "wsl"
        else
            echo "linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    else
        echo "unknown"
    fi
}

detect_shell() {
    if [[ -n "${ZSH_VERSION:-}" ]]; then
        echo "zsh"
    elif [[ -n "${BASH_VERSION:-}" ]]; then
        echo "bash"
    else
        echo "unknown"
    fi
}

get_shell_rc() {
    local shell=$(detect_shell)
    case "$shell" in
        zsh) echo "${HOME}/.zshrc" ;;
        bash)
            [[ -f "${HOME}/.bashrc" ]] && echo "${HOME}/.bashrc" || echo "${HOME}/.bash_profile"
            ;;
        *) echo "" ;;
    esac
}

# ─────────────────────────────────────────────────────────────────────────────
# Version Management
# ─────────────────────────────────────────────────────────────────────────────

get_installed_version() {
    if [[ -f "${FLYNN_DIR}/package.json" ]]; then
        node -pe "require('${FLYNN_DIR}/package.json').version" 2>/dev/null || echo "unknown"
    else
        echo "not_installed"
    fi
}

version_compare() {
    # Returns: 0 if equal, 1 if $1 > $2, 2 if $1 < $2
    if [[ "$1" == "$2" ]]; then
        return 0
    fi

    local IFS=.
    local i ver1=($1) ver2=($2)

    for ((i=0; i<${#ver1[@]} || i<${#ver2[@]}; i++)); do
        if [[ ${ver1[i]:-0} -gt ${ver2[i]:-0} ]]; then
            return 1
        elif [[ ${ver1[i]:-0} -lt ${ver2[i]:-0} ]]; then
            return 2
        fi
    done
    return 0
}

# ─────────────────────────────────────────────────────────────────────────────
# PATH Management
# ─────────────────────────────────────────────────────────────────────────────

ensure_local_bin_in_path() {
    mkdir -p "$LOCAL_BIN"
    export PATH="$LOCAL_BIN:$PATH"

    # Ensure pnpm global bin dir is set
    export PNPM_HOME="${HOME}/.local/share/pnpm"
    case ":$PATH:" in
        *":$PNPM_HOME:"*) ;;
        *) export PATH="$PNPM_HOME:$PATH" ;;
    esac

    # Add to shell config if not present
    local shell_rc=$(get_shell_rc)
    if [[ -n "$shell_rc" && -f "$shell_rc" ]]; then
        if ! grep -q '\.local/bin' "$shell_rc" 2>/dev/null; then
            if [[ "$DRY_RUN" == false ]]; then
                cat >> "$shell_rc" << 'EOF'

# Added by Flynn installer
export PATH="$HOME/.local/bin:$PATH"
EOF
                log_info "Added ~/.local/bin to PATH in $shell_rc"
            fi
        fi

        if ! grep -q 'PNPM_HOME' "$shell_rc" 2>/dev/null; then
            if [[ "$DRY_RUN" == false ]]; then
                cat >> "$shell_rc" << 'EOF'

# Added by Flynn installer (pnpm)
export PNPM_HOME="$HOME/.local/share/pnpm"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac
EOF
                log_info "Added PNPM_HOME to PATH in $shell_rc"
            fi
        fi
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
# Prerequisite Checks
# ─────────────────────────────────────────────────────────────────────────────

check_git() {
    command -v git &> /dev/null
}

check_fnm() {
    command -v fnm &> /dev/null || [[ -x "$LOCAL_BIN/fnm" ]]
}

check_node() {
    command -v node &> /dev/null
}

check_pnpm() {
    command -v pnpm &> /dev/null
}

check_uv() {
    command -v uv &> /dev/null || [[ -x "$LOCAL_BIN/uv" ]]
}

check_python() {
    if command -v python3 &> /dev/null; then
        python3 -c "import sys; exit(0 if sys.version_info >= (3, 11) else 1)" 2>/dev/null
        return $?
    fi
    return 1
}

check_claude_code() {
    command -v claude &> /dev/null || [[ -x "$LOCAL_BIN/claude" ]]
}

check_flynn_installed() {
    [[ -d "$FLYNN_DIR" && -f "${FLYNN_DIR}/package.json" ]]
}

# ─────────────────────────────────────────────────────────────────────────────
# Installation Functions
# ─────────────────────────────────────────────────────────────────────────────

install_fnm() {
    start_spinner "Installing fnm..."

    if [[ "$DRY_RUN" == true ]]; then
        stop_spinner "skip" "Would install fnm"
        return 0
    fi

    if curl -fsSL https://fnm.vercel.app/install | bash -s -- --install-dir "$LOCAL_SHARE/fnm" --skip-shell > /dev/null 2>&1; then
        ln -sf "$LOCAL_SHARE/fnm/fnm" "$LOCAL_BIN/fnm" 2>/dev/null || true
        export PATH="$LOCAL_SHARE/fnm:$PATH"
        eval "$(fnm env)" 2>/dev/null || true

        # Add to shell config
        local shell_rc=$(get_shell_rc)
        if [[ -n "$shell_rc" ]] && ! grep -q 'fnm env' "$shell_rc" 2>/dev/null; then
            cat >> "$shell_rc" << 'EOF'

# fnm (Fast Node Manager)
export PATH="$HOME/.local/share/fnm:$PATH"
eval "$(fnm env)"
EOF
        fi

        stop_spinner "ok" "fnm $(fnm --version 2>/dev/null | cut -d' ' -f2 || echo 'installed')"
        return 0
    else
        stop_spinner "fail" "Failed to install fnm"
        return 1
    fi
}

install_node() {
    start_spinner "Installing Node.js v${NODE_VERSION}..."

    if [[ "$DRY_RUN" == true ]]; then
        stop_spinner "skip" "Would install Node.js v${NODE_VERSION}"
        return 0
    fi

    export PATH="$LOCAL_SHARE/fnm:$LOCAL_BIN:$PATH"
    eval "$(fnm env)" 2>/dev/null || true

    if fnm install "$NODE_VERSION" > /dev/null 2>&1 && \
       fnm use "$NODE_VERSION" > /dev/null 2>&1 && \
       fnm default "$NODE_VERSION" > /dev/null 2>&1; then
        stop_spinner "ok" "Node.js $(node -v 2>/dev/null || echo "v$NODE_VERSION")"
        return 0
    else
        stop_spinner "fail" "Failed to install Node.js"
        return 1
    fi
}

install_pnpm() {
    start_spinner "Installing pnpm..."

    if [[ "$DRY_RUN" == true ]]; then
        stop_spinner "skip" "Would install pnpm"
        return 0
    fi

    if command -v corepack &> /dev/null; then
        corepack enable > /dev/null 2>&1 || true
        corepack prepare pnpm@latest --activate > /dev/null 2>&1 || npm install -g pnpm > /dev/null 2>&1
    else
        npm install -g pnpm > /dev/null 2>&1
    fi

    if command -v pnpm &> /dev/null; then
        stop_spinner "ok" "pnpm v$(pnpm -v 2>/dev/null)"
        return 0
    else
        stop_spinner "fail" "Failed to install pnpm"
        return 1
    fi
}

install_uv() {
    start_spinner "Installing uv..."

    if [[ "$DRY_RUN" == true ]]; then
        stop_spinner "skip" "Would install uv"
        return 0
    fi

    if curl -LsSf https://astral.sh/uv/install.sh 2>/dev/null | sh > /dev/null 2>&1; then
        export PATH="$LOCAL_BIN:$PATH"
        stop_spinner "ok" "uv $(uv --version 2>/dev/null | cut -d' ' -f2 || echo 'installed')"
        return 0
    else
        stop_spinner "fail" "Failed to install uv"
        return 1
    fi
}

install_python() {
    start_spinner "Installing Python ${PYTHON_VERSION}..."

    if [[ "$DRY_RUN" == true ]]; then
        stop_spinner "skip" "Would install Python ${PYTHON_VERSION}"
        return 0
    fi

    if uv python install "$PYTHON_VERSION" > /dev/null 2>&1; then
        local pyver=$(uv python find "$PYTHON_VERSION" 2>/dev/null | xargs -I{} {} --version 2>/dev/null | cut -d' ' -f2 || echo "$PYTHON_VERSION")
        stop_spinner "ok" "Python $pyver"
        return 0
    else
        stop_spinner "fail" "Failed to install Python"
        return 1
    fi
}

install_claude_code() {
    start_spinner "Installing Claude Code..."

    if [[ "$DRY_RUN" == true ]]; then
        stop_spinner "skip" "Would install Claude Code"
        return 0
    fi

    if npm install -g @anthropic-ai/claude-code > /dev/null 2>&1; then
        stop_spinner "ok" "Claude Code $(claude --version 2>/dev/null || echo 'installed')"
        return 0
    else
        stop_spinner "fail" "Failed to install Claude Code"
        return 1
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
# Puppeteer Dependencies (formerly scripts/install-puppeteer-deps.sh)
# ─────────────────────────────────────────────────────────────────────────────

# Puppeteer system dependencies for Linux
PUPPETEER_DEPS=(
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

install_puppeteer_deps() {
    local os=$(detect_os)

    if [[ "$os" != "linux" && "$os" != "wsl" ]]; then
        print_warn "Puppeteer dependencies only needed on Linux/WSL"
        return 0
    fi

    start_spinner "Installing Puppeteer/Chrome dependencies..."

    if [[ "$DRY_RUN" == true ]]; then
        stop_spinner "skip" "Would install Puppeteer dependencies"
        return 0
    fi

    # Check if running as root (not allowed)
    if [[ "$EUID" -eq 0 ]]; then
        stop_spinner "fail" "Do not run as root - sudo will be used for apt-get"
        return 1
    fi

    # Update package lists
    if ! sudo apt-get update > /dev/null 2>&1; then
        stop_spinner "fail" "Failed to update package lists"
        return 1
    fi

    # Install dependencies
    local deps_str="${PUPPETEER_DEPS[*]}"
    if sudo apt-get install -y $deps_str > /dev/null 2>&1; then
        stop_spinner "ok" "Puppeteer dependencies installed (${#PUPPETEER_DEPS[@]} packages)"
    else
        stop_spinner "fail" "Failed to install some Puppeteer dependencies"
        return 1
    fi

    return 0
}

verify_puppeteer() {
    start_spinner "Verifying Puppeteer..."

    if [[ "$DRY_RUN" == true ]]; then
        stop_spinner "skip" "Would verify Puppeteer"
        return 0
    fi

    # Test if Puppeteer can launch
    local test_script='
const puppeteer = require("puppeteer");
(async () => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    await browser.close();
    process.exit(0);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
})();
'

    if [[ -d "$FLYNN_DIR" ]]; then
        if (cd "$FLYNN_DIR" && node -e "$test_script" 2>/dev/null); then
            stop_spinner "ok" "Puppeteer works correctly"
            return 0
        else
            stop_spinner "warn" "Puppeteer test failed (system dependencies may be missing)"
            return 1
        fi
    else
        stop_spinner "skip" "Flynn not installed, skipping Puppeteer test"
        return 0
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
# External MCP Servers Installation
# ─────────────────────────────────────────────────────────────────────────────

# External MCP servers that Flynn integrates with
# Note: SQLite MCP server removed - Flynn uses internal LibSQL for analytics
declare -A EXTERNAL_MCP_SERVERS=(
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

install_external_mcp_servers() {
    echo ""
    echo -e "  ${BOLD}Installing External MCP Servers${NC}"
    echo ""

    if [[ "$DRY_RUN" == true ]]; then
        print_info "Would install ${#EXTERNAL_MCP_SERVERS[@]} external MCP servers"
        return 0
    fi

    local installed=0
    local failed=0
    local skipped=0

    for server_name in "${!EXTERNAL_MCP_SERVERS[@]}"; do
        local install_cmd="${EXTERNAL_MCP_SERVERS[$server_name]}"
        IFS=':' read -ra cmd_parts <<< "$install_cmd"
        local runner="${cmd_parts[0]}"

        # Check if runner is available
        if [[ "$runner" == "uvx" ]] && ! command -v uvx &>/dev/null; then
            start_spinner "Installing $server_name..."
            stop_spinner "skip" "$server_name (uvx not available)"
            ((skipped++))
            continue
        fi

        start_spinner "Installing $server_name..."

        # Build command
        local full_cmd="$runner"
        for i in "${!cmd_parts[@]}"; do
            if [[ $i -gt 0 ]]; then
                full_cmd="$full_cmd ${cmd_parts[$i]}"
            fi
        done

        # Execute installation (this will cache the package)
        if $full_cmd --help &>/dev/null 2>&1 || $full_cmd --version &>/dev/null 2>&1; then
            stop_spinner "ok" "$server_name"
            ((installed++))
        else
            stop_spinner "warn" "$server_name (installation may have failed, will be installed on first use)"
            ((failed++))
        fi
    done

    echo ""
    print_info "Installed: $installed, Failed: $failed, Skipped: $skipped"
    log_info "External MCP servers: $installed installed, $failed failed, $skipped skipped"

    # Don't fail the installation if some servers failed
    # They will be installed on-demand by Claude Code
    return 0
}

# ─────────────────────────────────────────────────────────────────────────────
# Flynn Installation
# ─────────────────────────────────────────────────────────────────────────────

install_flynn_packages() {
    start_spinner "Cloning Flynn repository..."

    if [[ "$DRY_RUN" == true ]]; then
        stop_spinner "skip" "Would clone Flynn repository"
        return 0
    fi

    mkdir -p "$LOCAL_SHARE"

    if [[ ! -d "$FLYNN_DIR" ]]; then
        if [[ "$OFFLINE" == true ]]; then
            stop_spinner "fail" "Flynn repository missing (offline mode)"
            return 1
        fi

        if git clone --depth 1 https://github.com/reze83/Flynn-Project.git "$FLYNN_DIR" > /dev/null 2>&1; then
            stop_spinner "ok" "Flynn repository cloned"
        else
            stop_spinner "fail" "Failed to clone repository"
            return 1
        fi
    else
        if [[ "$OFFLINE" != true ]]; then
            (cd "$FLYNN_DIR" && git pull --ff-only > /dev/null 2>&1) || true
        fi
        stop_spinner "ok" "Flynn repository up to date"
    fi

    # Configure pnpm
    start_spinner "Installing dependencies..."

    cat > "$FLYNN_DIR/.npmrc" << 'EOF'
enable-pre-post-scripts=true
ignore-scripts=false
EOF

    local install_result=0
    if [[ "$OFFLINE" == true ]]; then
        (cd "$FLYNN_DIR" && pnpm install --offline > /dev/null 2>&1) || install_result=$?
    else
        (cd "$FLYNN_DIR" && pnpm install > /dev/null 2>&1) || install_result=$?
    fi

    if [[ $install_result -eq 0 ]]; then
        stop_spinner "ok" "Dependencies installed"
    else
        stop_spinner "fail" "Failed to install dependencies"
        return 1
    fi

    # Install Python packages if full mode
    if [[ "$INSTALL_MODE" == "full" ]]; then
        start_spinner "Installing Python packages..."

        local python_result=0
        if [[ "$OFFLINE" == true ]]; then
            (cd "$FLYNN_DIR/packages/python" && uv venv > /dev/null 2>&1 && UV_PROJECT_ENVIRONMENT=.venv uv pip install -e . --offline > /dev/null 2>&1) || python_result=$?
        else
            (cd "$FLYNN_DIR/packages/python" && uv venv > /dev/null 2>&1 && UV_PROJECT_ENVIRONMENT=.venv uv pip install -e . > /dev/null 2>&1) || python_result=$?
        fi

        if [[ $python_result -eq 0 ]]; then
            stop_spinner "ok" "Python packages installed"
        else
            stop_spinner "warn" "Python packages installation failed (optional)"
        fi
    fi

    # Build packages
    start_spinner "Building packages..."

    if (cd "$FLYNN_DIR" && pnpm build > /dev/null 2>&1); then
        stop_spinner "ok" "Packages built"
        return 0
    else
        stop_spinner "fail" "Failed to build packages"
        return 1
    fi
}

configure_flynn() {
    # Install slash command
    start_spinner "Installing /flynn slash command..."

    if [[ "$DRY_RUN" == true ]]; then
        stop_spinner "skip" "Would install /flynn slash command"
    else
        mkdir -p "$CLAUDE_COMMANDS_DIR"
        if [[ -f "$FLYNN_DIR/.claude/commands/flynn.md" ]]; then
            cp "$FLYNN_DIR/.claude/commands/flynn.md" "$CLAUDE_COMMANDS_DIR/flynn.md"
            stop_spinner "ok" "/flynn slash command installed"
        else
            stop_spinner "warn" "/flynn slash command not found"
        fi
    fi

    # Register MCP server
    start_spinner "Registering Flynn MCP server..."

    if [[ "$DRY_RUN" == true ]]; then
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
    else
        stop_spinner "fail" "Failed to register MCP server"
        return 1
    fi

    # Configure permissions
    start_spinner "Configuring permissions..."

    mkdir -p "$(dirname "$CLAUDE_SETTINGS")"

    if [[ ! -f "$CLAUDE_SETTINGS" ]]; then
        echo '{"permissions":{"allow":[],"deny":[]}}' > "$CLAUDE_SETTINGS"
    fi

    # Merge Flynn tools and external MCP tools
    local all_tools=("${FLYNN_TOOLS[@]}" "${EXTERNAL_MCP_TOOLS[@]}")
    local tools_json=$(printf '%s\n' "${all_tools[@]}" | jq -R . | jq -s .)
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
    else
        stop_spinner "fail" "Failed to configure permissions"
        return 1
    fi

    # Configure Codex CLI if installed
    if command -v codex &>/dev/null; then
        configure_codex_cli
    fi

    return 0
}

# ─────────────────────────────────────────────────────────────────────────────
# Codex CLI Configuration
# ─────────────────────────────────────────────────────────────────────────────

configure_codex_cli() {
    start_spinner "Configuring Codex CLI MCP servers..."

    if [[ "$DRY_RUN" == true ]]; then
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

    # Get API keys from existing config
    local CONTEXT7_API_KEY=""
    local EXA_API_KEY=""
    local MEM0_API_KEY=""

    if [[ -f "$CODEX_CONFIG" ]]; then
        CONTEXT7_API_KEY=$(grep -A2 '\[mcp_servers.context7.env\]' "$CODEX_CONFIG" 2>/dev/null | grep 'CONTEXT7_API_KEY' | cut -d'"' -f2 || echo "")
        EXA_API_KEY=$(grep -A2 '\[mcp_servers.exa.env\]' "$CODEX_CONFIG" 2>/dev/null | grep 'EXA_API_KEY' | cut -d'"' -f2 || echo "")
        MEM0_API_KEY=$(grep -A2 '\[mcp_servers.mem0.env\]' "$CODEX_CONFIG" 2>/dev/null | grep 'MEM0_API_KEY' | cut -d'"' -f2 || echo "")
    fi

    # Detect uvx path
    local UVX_PATH=""
    if command -v uvx &>/dev/null; then
        UVX_PATH=$(command -v uvx)
    elif [[ -x "${LOCAL_BIN}/uvx" ]]; then
        UVX_PATH="${LOCAL_BIN}/uvx"
    fi

    # Generate config
    cat > "$CODEX_CONFIG" << TOML
# ============================================================================
# Codex CLI Configuration - Generated by Flynn Installer v${FLYNN_VERSION}
# ============================================================================
# All MCP servers pre-configured for seamless AI agent collaboration
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# ============================================================================

# Model Configuration
model = "gpt-5.1-codex-max"
model_reasoning_effort = "xhigh"

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

    if [[ -n "$CONTEXT7_API_KEY" ]]; then
        cat >> "$CODEX_CONFIG" << TOML
[mcp_servers.context7.env]
CONTEXT7_API_KEY = "${CONTEXT7_API_KEY}"

TOML
    fi

    cat >> "$CODEX_CONFIG" << TOML
# Exa - Web Search & Research
[mcp_servers.exa]
type = "stdio"
command = "npx"
args = ["-y", "exa-mcp-server", "tools=web_search_exa,deep_search_exa,get_code_context_exa,crawling_exa,deep_researcher_start,deep_researcher_check"]

TOML

    if [[ -n "$EXA_API_KEY" ]]; then
        cat >> "$CODEX_CONFIG" << TOML
[mcp_servers.exa.env]
EXA_API_KEY = "${EXA_API_KEY}"

TOML
    fi

    cat >> "$CODEX_CONFIG" << TOML
# Sequential Thinking - Structured Problem Solving
[mcp_servers.sequentialthinking-tools]
type = "stdio"
command = "npx"
args = ["-y", "mcp-sequentialthinking-tools"]

[mcp_servers.sequentialthinking-tools.env]
MAX_HISTORY_SIZE = "1000"

TOML

    # Add Python-based servers if uvx is available
    if [[ -n "$UVX_PATH" ]]; then
        cat >> "$CODEX_CONFIG" << TOML
# Mem0 - Persistent Memory
[mcp_servers.mem0]
type = "stdio"
startup_timeout_sec = 30
command = "${UVX_PATH}"
args = ["mem0-mcp-server"]

TOML

        if [[ -n "$MEM0_API_KEY" ]]; then
            cat >> "$CODEX_CONFIG" << TOML
[mcp_servers.mem0.env]
MEM0_API_KEY = "${MEM0_API_KEY}"

TOML
        fi

        cat >> "$CODEX_CONFIG" << TOML
# Serena - Semantic Code Analysis
[mcp_servers.serena]
type = "stdio"
command = "${UVX_PATH}"
args = ["--from", "git+https://github.com/oraios/serena", "serena", "start-mcp-server"]

TOML
    fi

    cat >> "$CODEX_CONFIG" << TOML
# ============================================================================
# UI Settings
# ============================================================================

[notice]
hide_full_access_warning = true
TOML

    # Count configured servers
    local MCP_COUNT=$(grep -c '^\[mcp_servers\.' "$CODEX_CONFIG" 2>/dev/null || echo "0")

    stop_spinner "ok" "Codex CLI configured (${MCP_COUNT} MCP servers)"
    log_success "Codex CLI configured with ${MCP_COUNT} MCP servers"
    return 0
}

# ─────────────────────────────────────────────────────────────────────────────
# Migration
# ─────────────────────────────────────────────────────────────────────────────

migrate_old_installations() {
    start_spinner "Checking legacy Flynn configuration..."

    if [[ "$DRY_RUN" == true ]]; then
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

# ─────────────────────────────────────────────────────────────────────────────
# Verification
# ─────────────────────────────────────────────────────────────────────────────

# Expected MCP servers (formerly scripts/verify-mcp-servers.sh)
EXPECTED_MCP_SERVERS=(
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

verify_detailed() {
    echo ""
    echo -e "  ${BOLD}=== MCP Server Detailed Verification ===${NC}"
    echo ""

    # 1. Check environment variables
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

    # 2. Check configuration files
    echo -e "  ${BOLD}2. Configuration Files${NC}"

    if [[ -f "$CLAUDE_JSON" ]]; then
        local global_count=$(node -e "
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
        local perms_count=$(node -e "
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
        local codex_count=$(grep -c '^\[mcp_servers\.' "$CODEX_CONFIG" 2>/dev/null || echo "0")
        echo -e "     ${GREEN}✓${NC} Codex config ($CODEX_CONFIG): ${codex_count} servers"
    else
        echo -e "     ${DIM}○${NC} Codex config not found (optional)"
    fi
    echo ""

    # 3. Expected MCP servers
    echo -e "  ${BOLD}3. Expected MCP Servers (${#EXPECTED_MCP_SERVERS[@]} total)${NC}"
    for server in "${EXPECTED_MCP_SERVERS[@]}"; do
        if [[ -f "$CLAUDE_JSON" ]] && grep -q "\"$server\"" "$CLAUDE_JSON" 2>/dev/null; then
            echo -e "     ${GREEN}✓${NC} $server"
        else
            echo -e "     ${DIM}○${NC} $server ${DIM}(not configured)${NC}"
        fi
    done
    echo ""

    # 4. Package runners
    echo -e "  ${BOLD}4. Package Runners${NC}"
    for cmd in npx uvx node pnpm; do
        if command -v "$cmd" &>/dev/null; then
            local ver=$($cmd --version 2>/dev/null | head -1)
            echo -e "     ${GREEN}✓${NC} $cmd: $ver"
        else
            echo -e "     ${RED}✗${NC} $cmd: NOT FOUND"
        fi
    done
    echo ""

    # 5. Flynn server
    echo -e "  ${BOLD}5. Flynn Server${NC}"
    if [[ -f "$FLYNN_MCP_SERVER_PATH" ]]; then
        echo -e "     ${GREEN}✓${NC} server.js exists"
    else
        echo -e "     ${RED}✗${NC} server.js NOT FOUND"
    fi
    echo ""

    echo -e "  ${BOLD}=== Verification Complete ===${NC}"
    echo ""
    echo -e "  ${DIM}To test in Claude Code:${NC}"
    echo -e "    ${CYAN}/flynn list-mcp-tools${NC}"
    echo ""
}

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
        ((errors++))
    fi

    # Check MCP server
    if [[ -f "$CLAUDE_JSON" ]] && grep -q "flynn" "$CLAUDE_JSON" 2>/dev/null; then
        print_done "MCP server registered"
        mcp_registered=true
    else
        print_fail "MCP server not registered"
        ((errors++))
    fi

    # Check MCP server path
    if [[ "$mcp_registered" == true ]]; then
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
            ((errors++))
        elif [[ -z "$configured_path" ]]; then
            print_fail "MCP server path missing in config"
            ((errors++))
        elif [[ "$configured_path" != "$FLYNN_MCP_SERVER_PATH" ]]; then
            print_fail "MCP server path outdated (${configured_path})"
            ((errors++))
        else
            print_done "MCP server path valid"
        fi
    fi

    # Check permissions
    if [[ -f "$CLAUDE_SETTINGS" ]] && grep -q "mcp__flynn" "$CLAUDE_SETTINGS" 2>/dev/null; then
        print_done "Permissions configured"
    else
        print_fail "Permissions not configured"
        ((errors++))
    fi

    # Check slash command
    if [[ -f "$CLAUDE_COMMANDS_DIR/flynn.md" ]]; then
        print_done "/flynn slash command installed"
    else
        print_fail "/flynn slash command not found"
        ((errors++))
    fi

    # Check version
    local version=$(get_installed_version)
    if [[ "$version" != "not_installed" && "$version" != "unknown" ]]; then
        print_done "Flynn v${version} installed"
    else
        print_fail "Flynn version unknown"
        ((errors++))
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

# ─────────────────────────────────────────────────────────────────────────────
# Operation Modes
# ─────────────────────────────────────────────────────────────────────────────

mode_install() {
    print_header

    local current_version=$(get_installed_version)

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

    local os=$(detect_os)
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

    # Determine steps (Puppeteer and External MCP servers included by default)
    local total_steps=7
    [[ "$INSTALL_MODE" == "full" ]] && total_steps=8
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
            local pyver=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
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

    # Step 4: External MCP Servers
    print_step "$current_step" "$total_steps" "External MCP Servers"
    ((current_step++))

    install_external_mcp_servers || log_warn "Some external MCP servers failed to install"

    # Step 5: Flynn Packages
    print_step "$current_step" "$total_steps" "Flynn Packages"
    ((current_step++))

    install_flynn_packages || { execute_rollback "Flynn package installation failed"; exit 1; }

    # Step 6: Configuration
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
    echo -e "    2. Restart Claude Code"
    echo -e "    3. Try: ${CYAN}/flynn${NC} or ${CYAN}mcp__flynn__list-workflows${NC}"
    if command -v codex &>/dev/null; then
        echo -e "    4. Verify Codex: ${CYAN}codex mcp list${NC}"
    fi
    echo ""
}

mode_update() {
    print_header

    local current_version=$(get_installed_version)

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

    verify_installation

    # Optional detailed verification
    if [[ "$VERIFY_DETAILED" == true ]]; then
        verify_detailed
    fi

    echo ""
    echo -e "  ${DIM}For detailed logs, see: ${FLYNN_LOG_FILE}${NC}"
    echo ""
}

# ─────────────────────────────────────────────────────────────────────────────
# Help
# ─────────────────────────────────────────────────────────────────────────────

show_help() {
    cat << EOF

${BOLD}Flynn Enhanced Installer v${FLYNN_VERSION}${NC}

${BOLD}USAGE:${NC}
    $0 [OPTIONS]

${BOLD}OPERATION MODES:${NC}
    --install          Fresh installation (default)
    --update          Update existing installation
    --uninstall       Remove Flynn completely
    --verify          Health check of installation

${BOLD}INSTALLATION OPTIONS:${NC}
    --minimal         Node.js + pnpm only
    --full            Include Python/ML tools (default)
    --without-puppeteer  Skip Puppeteer/Chrome system dependencies (installed by default on Linux/WSL)
    --offline         Use cached packages
    --non-interactive No prompts (for CI/CD)
    --dry-run         Show actions without executing
    --debug           Verbose output

${BOLD}VERIFICATION OPTIONS:${NC}
    --verify-basic    Skip detailed MCP server checks (runs detailed verification by default)

${BOLD}UNINSTALL OPTIONS:${NC}
    --keep-config     Preserve configuration during uninstall

${BOLD}GENERAL OPTIONS:${NC}
    --help            Show this help

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

    # Non-interactive installation (CI/CD)
    $0 --install --non-interactive

    # Installation without Puppeteer deps (skip browser automation)
    $0 --install --without-puppeteer

    # Basic verification (skip detailed MCP checks)
    $0 --verify --verify-basic

${BOLD}PATHS:${NC}
    Flynn:       ${FLYNN_DIR}
    Config:      ${CLAUDE_JSON}
    Permissions: ${CLAUDE_SETTINGS}
    Commands:    ${CLAUDE_COMMANDS_DIR}
    Logs:        ${FLYNN_LOG_FILE}

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
            mode_verify
            ;;
        *)
            echo "Invalid operation mode: $OPERATION_MODE"
            exit 1
            ;;
    esac
}

# Trap errors and perform rollback
trap 'if [[ $? -ne 0 ]]; then execute_rollback "Unexpected error"; fi' ERR

# Run main
main "$@"

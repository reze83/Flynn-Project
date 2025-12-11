#!/usr/bin/env bash
# ============================================================================
# Module: lib/common.sh
# Description: Logging, output formatting, and spinner functions
# Author: Flynn Project
# Version: 2.0.0
# Dependencies: config/constants.sh
# ============================================================================
# Source: Google Bash Style Guide, Cursor Rules 2025
# Pattern: Facade Pattern - Simplified interface for logging operations
# ============================================================================

# Prevent multiple sourcing
[[ -n "${_COMMON_SOURCED:-}" ]] && return 0
readonly _COMMON_SOURCED=1

# Global spinner state
SPINNER_PID=""

# ─────────────────────────────────────────────────────────────────────────────
# Logging Functions
# ─────────────────────────────────────────────────────────────────────────────

setup_logging() {
    mkdir -p "$FLYNN_LOG_DIR"

    # Rotate logs (keep last 5)
    if [[ -f "$FLYNN_LOG_FILE" ]]; then
        local i
        for i in {4..1}; do
            [[ -f "${FLYNN_LOG_FILE}.$i" ]] && mv "${FLYNN_LOG_FILE}.$i" "${FLYNN_LOG_FILE}.$((i+1))"
        done
        mv "$FLYNN_LOG_FILE" "${FLYNN_LOG_FILE}.1"
    fi

    # Create new log
    touch "$FLYNN_LOG_FILE"
    log_info "Flynn Installer v${FLYNN_VERSION} started"
    log_info "Operation: ${OPERATION_MODE:-unknown}, Mode: ${INSTALL_MODE:-unknown}"
    log_info "System: $(uname -s) $(uname -m)"
}

log_action() {
    local level="$1"
    shift
    local message="$*"
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${timestamp}] ${level}: ${message}" >> "$FLYNN_LOG_FILE"
    if [[ "${DEBUG:-false}" == true ]]; then
        echo -e "  ${DIM}[${level}] ${message}${NC}"
    fi
}

log_info() { log_action "INFO" "$@"; }
log_step() { log_action "STEP" "$@"; }
log_success() { log_action "SUCCESS" "$@"; }
log_warn() { log_action "WARN" "$@"; }
log_error() { log_action "ERROR" "$@"; }
log_rollback() { log_action "ROLLBACK" "$@"; }

# ─────────────────────────────────────────────────────────────────────────────
# Error Handling
# ─────────────────────────────────────────────────────────────────────────────

# Exit with error message
# Usage: die "Error message" [exit_code]
die() {
    local message="$1"
    local code="${2:-1}"
    log_error "$message"
    echo -e "  ${RED}✗${NC} $message" >&2
    exit "$code"
}

# ─────────────────────────────────────────────────────────────────────────────
# Spinner Functions
# ─────────────────────────────────────────────────────────────────────────────

start_spinner() {
    [[ "${NON_INTERACTIVE:-false}" == true ]] && return
    local msg="$1"
    (
        local i=0
        while true; do
            printf "\r  ${CYAN}${SPINNER_FRAMES[$i]}${NC} %s" "$msg"
            i=$(( (i + 1) % 10 ))
            sleep 0.08
        done
    ) &
    SPINNER_PID=$!
}

stop_spinner() {
    [[ "${NON_INTERACTIVE:-false}" == true ]] && return
    local status="$1"
    local msg="$2"

    if [[ -n "$SPINNER_PID" ]]; then
        kill "$SPINNER_PID" 2>/dev/null
        wait "$SPINNER_PID" 2>/dev/null || true
    fi
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
# User Input
# ─────────────────────────────────────────────────────────────────────────────

# Prompt user for input (with optional default value)
# Usage: prompt_user "Question?" "default_value"
# Returns: User input or default value
prompt_user() {
    local prompt="$1"
    local default="${2:-}"
    local user_input=""

    if [[ -n "$default" ]]; then
        echo -e "  ${CYAN}?${NC} $prompt ${DIM}(default: $default)${NC}"
    else
        echo -e "  ${CYAN}?${NC} $prompt"
    fi

    echo -n "    "
    read -r user_input

    if [[ -z "$user_input" && -n "$default" ]]; then
        echo "$default"
    else
        echo "$user_input"
    fi
}

# Prompt user for sensitive input (masked, like API keys)
# Usage: prompt_secret "Enter API key:" "default_value"
# Returns: User input (masked) or default value
prompt_secret() {
    local prompt="$1"
    local default="${2:-}"
    local user_input=""

    if [[ -n "$default" ]]; then
        echo -e "  ${CYAN}?${NC} $prompt ${DIM}(press Enter to keep existing)${NC}"
    else
        echo -e "  ${CYAN}?${NC} $prompt ${DIM}(optional, press Enter to skip)${NC}"
    fi

    echo -n "    "
    read -rs user_input
    echo ""

    if [[ -z "$user_input" && -n "$default" ]]; then
        echo "$default"
    else
        echo "$user_input"
    fi
}

#!/usr/bin/env bash
# ============================================================================
# Module: lib/prerequisites.sh
# Description: Dependency and prerequisite checks
# Author: Flynn Project
# Version: 2.0.0
# Dependencies: config/constants.sh, lib/common.sh
# ============================================================================
# Source: Google Bash Style Guide
# Pattern: Template Method - Standardized checks with consistent interface
# ============================================================================

# Prevent multiple sourcing
[[ -n "${_PREREQUISITES_SOURCED:-}" ]] && return 0
readonly _PREREQUISITES_SOURCED=1

# ─────────────────────────────────────────────────────────────────────────────
# Command Checks
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

check_codex_cli() {
    command -v codex &> /dev/null || [[ -x "$LOCAL_BIN/codex" ]]
}

check_flynn_installed() {
    [[ -d "$FLYNN_DIR" && -f "${FLYNN_DIR}/package.json" ]]
}

# ─────────────────────────────────────────────────────────────────────────────
# Comprehensive Prerequisite Check
# ─────────────────────────────────────────────────────────────────────────────

# Check all prerequisites and return a status array
# Usage: check_all_prerequisites
# Sets global array PREREQ_STATUS with results
check_all_prerequisites() {
    declare -gA PREREQ_STATUS

    PREREQ_STATUS[git]=$(check_git && echo "ok" || echo "missing")
    PREREQ_STATUS[fnm]=$(check_fnm && echo "ok" || echo "missing")
    PREREQ_STATUS[node]=$(check_node && echo "ok" || echo "missing")
    PREREQ_STATUS[pnpm]=$(check_pnpm && echo "ok" || echo "missing")
    PREREQ_STATUS[uv]=$(check_uv && echo "ok" || echo "missing")
    PREREQ_STATUS[python]=$(check_python && echo "ok" || echo "missing")
    PREREQ_STATUS[claude]=$(check_claude_code && echo "ok" || echo "missing")
    PREREQ_STATUS[codex]=$(check_codex_cli && echo "ok" || echo "missing")
    PREREQ_STATUS[flynn]=$(check_flynn_installed && echo "ok" || echo "missing")
}

# Print prerequisite status
print_prerequisites_status() {
    echo ""
    echo -e "  ${BOLD}Prerequisites Status${NC}"
    echo ""

    for prereq in git fnm node pnpm uv python claude codex flynn; do
        local status="${PREREQ_STATUS[$prereq]:-unknown}"
        if [[ "$status" == "ok" ]]; then
            print_done "$prereq"
        else
            print_fail "$prereq (not found)"
        fi
    done
}

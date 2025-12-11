#!/usr/bin/env bash
# ============================================================================
# Module: lib/environment.sh
# Description: Environment detection and PATH management
# Author: Flynn Project
# Version: 2.0.0
# Dependencies: config/constants.sh, lib/common.sh
# ============================================================================
# Source: Google Bash Style Guide, BashGuide/Practices
# Pattern: Strategy Pattern - Different behaviors based on detected environment
# ============================================================================

# Prevent multiple sourcing
[[ -n "${_ENVIRONMENT_SOURCED:-}" ]] && return 0
readonly _ENVIRONMENT_SOURCED=1

# ─────────────────────────────────────────────────────────────────────────────
# OS Detection
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

# ─────────────────────────────────────────────────────────────────────────────
# Shell Detection
# ─────────────────────────────────────────────────────────────────────────────

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
    local shell
    shell=$(detect_shell)
    case "$shell" in
        zsh) echo "${HOME}/.zshrc" ;;
        bash)
            [[ -f "${HOME}/.bashrc" ]] && echo "${HOME}/.bashrc" || echo "${HOME}/.bash_profile"
            ;;
        *) echo "" ;;
    esac
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
    local shell_rc
    shell_rc=$(get_shell_rc)

    if [[ -n "$shell_rc" && -f "$shell_rc" ]]; then
        _add_path_to_shellrc "$shell_rc"
        _add_pnpm_to_shellrc "$shell_rc"
    fi
}

_add_path_to_shellrc() {
    local shell_rc="$1"

    if ! grep -q '\.local/bin' "$shell_rc" 2>/dev/null; then
        if [[ "${DRY_RUN:-false}" == false ]]; then
            cat >> "$shell_rc" << 'EOF'

# Added by Flynn installer
export PATH="$HOME/.local/bin:$PATH"
EOF
            log_info "Added ~/.local/bin to PATH in $shell_rc"
        fi
    fi
}

_add_pnpm_to_shellrc() {
    local shell_rc="$1"

    if ! grep -q 'PNPM_HOME' "$shell_rc" 2>/dev/null; then
        if [[ "${DRY_RUN:-false}" == false ]]; then
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

# Compare semantic versions
# Returns: 0 if equal, 1 if $1 > $2, 2 if $1 < $2
version_compare() {
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

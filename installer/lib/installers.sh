#!/usr/bin/env bash
# ============================================================================
# Module: lib/installers.sh
# Description: Tool and dependency installation functions
# Author: Flynn Project
# Version: 2.0.0
# Dependencies: config/constants.sh, lib/common.sh, lib/environment.sh
# ============================================================================
# Source: Google Bash Style Guide, Cursor Rules 2025
# Pattern: Strategy Pattern - Different installation strategies per tool
# ============================================================================

# Prevent multiple sourcing
[[ -n "${_INSTALLERS_SOURCED:-}" ]] && return 0
readonly _INSTALLERS_SOURCED=1

# ─────────────────────────────────────────────────────────────────────────────
# fnm (Fast Node Manager) Installation
# ─────────────────────────────────────────────────────────────────────────────

install_fnm() {
    start_spinner "Installing fnm..."

    if [[ "${DRY_RUN:-false}" == true ]]; then
        stop_spinner "skip" "Would install fnm"
        return 0
    fi

    if curl -fsSL https://fnm.vercel.app/install | bash -s -- --install-dir "$LOCAL_SHARE/fnm" --skip-shell > /dev/null 2>&1; then
        ln -sf "$LOCAL_SHARE/fnm/fnm" "$LOCAL_BIN/fnm" 2>/dev/null || true
        export PATH="$LOCAL_SHARE/fnm:$PATH"
        eval "$(fnm env)" 2>/dev/null || true

        _add_fnm_to_shellrc
        stop_spinner "ok" "fnm $(fnm --version 2>/dev/null | cut -d' ' -f2 || echo 'installed')"
        return 0
    else
        stop_spinner "fail" "Failed to install fnm"
        return 1
    fi
}

_add_fnm_to_shellrc() {
    local shell_rc
    shell_rc=$(get_shell_rc)

    if [[ -n "$shell_rc" ]] && ! grep -q 'fnm env' "$shell_rc" 2>/dev/null; then
        cat >> "$shell_rc" << 'EOF'

# fnm (Fast Node Manager)
export PATH="$HOME/.local/share/fnm:$PATH"
eval "$(fnm env)"
EOF
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
# Node.js Installation
# ─────────────────────────────────────────────────────────────────────────────

install_node() {
    start_spinner "Installing Node.js v${NODE_VERSION}..."

    if [[ "${DRY_RUN:-false}" == true ]]; then
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

# ─────────────────────────────────────────────────────────────────────────────
# pnpm Installation
# ─────────────────────────────────────────────────────────────────────────────

install_pnpm() {
    start_spinner "Installing pnpm..."

    if [[ "${DRY_RUN:-false}" == true ]]; then
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

# ─────────────────────────────────────────────────────────────────────────────
# uv (Python Package Manager) Installation
# ─────────────────────────────────────────────────────────────────────────────

install_uv() {
    start_spinner "Installing uv..."

    if [[ "${DRY_RUN:-false}" == true ]]; then
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

# ─────────────────────────────────────────────────────────────────────────────
# Python Installation
# ─────────────────────────────────────────────────────────────────────────────

install_python() {
    start_spinner "Installing Python ${PYTHON_VERSION}..."

    if [[ "${DRY_RUN:-false}" == true ]]; then
        stop_spinner "skip" "Would install Python ${PYTHON_VERSION}"
        return 0
    fi

    if uv python install "$PYTHON_VERSION" > /dev/null 2>&1; then
        local pyver
        pyver=$(uv python find "$PYTHON_VERSION" 2>/dev/null | xargs -I{} {} --version 2>/dev/null | cut -d' ' -f2 || echo "$PYTHON_VERSION")
        stop_spinner "ok" "Python $pyver"
        return 0
    else
        stop_spinner "fail" "Failed to install Python"
        return 1
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
# Claude Code Installation
# ─────────────────────────────────────────────────────────────────────────────

install_claude_code() {
    start_spinner "Installing Claude Code..."

    if [[ "${DRY_RUN:-false}" == true ]]; then
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
# Codex CLI Installation
# ─────────────────────────────────────────────────────────────────────────────

install_codex_cli() {
    start_spinner "Installing Codex CLI..."

    if [[ "${DRY_RUN:-false}" == true ]]; then
        stop_spinner "skip" "Would install Codex CLI"
        return 0
    fi

    # Install via npm (cross-platform)
    if npm install -g @openai/codex > /dev/null 2>&1; then
        local version
        version=$(codex --version 2>/dev/null | head -1 || echo 'installed')
        stop_spinner "ok" "Codex CLI $version"
        log_info "Codex CLI installed successfully"
        return 0
    else
        stop_spinner "warn" "Failed to install Codex CLI (optional)"
        log_warn "Codex CLI installation failed - will skip configuration"
        return 1
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
# Puppeteer Dependencies (Linux/WSL)
# ─────────────────────────────────────────────────────────────────────────────

install_puppeteer_deps() {
    local os
    os=$(detect_os)

    if [[ "$os" != "linux" && "$os" != "wsl" ]]; then
        print_warn "Puppeteer dependencies only needed on Linux/WSL"
        return 0
    fi

    start_spinner "Installing Puppeteer/Chrome dependencies..."

    if [[ "${DRY_RUN:-false}" == true ]]; then
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

    if [[ "${DRY_RUN:-false}" == true ]]; then
        stop_spinner "skip" "Would verify Puppeteer"
        return 0
    fi

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

install_external_mcp_servers() {
    echo ""
    echo -e "  ${BOLD}Installing External MCP Servers${NC}"
    echo ""

    if [[ "${DRY_RUN:-false}" == true ]]; then
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
    return 0
}

# ─────────────────────────────────────────────────────────────────────────────
# Flynn Package Installation
# ─────────────────────────────────────────────────────────────────────────────

install_flynn_packages() {
    _clone_flynn_repository || return 1
    _install_flynn_dependencies || return 1
    _install_python_packages
    _build_flynn_packages || return 1
    return 0
}

_clone_flynn_repository() {
    local repo_url="https://github.com/reze83/Flynn-Project.git"
    local max_retries=3
    local retry_count=0
    local clone_result=0

    start_spinner "Cloning Flynn repository..."

    if [[ "${DRY_RUN:-false}" == true ]]; then
        stop_spinner "skip" "Would clone Flynn repository"
        return 0
    fi

    mkdir -p "$LOCAL_SHARE"

    if [[ ! -d "$FLYNN_DIR" ]]; then
        if [[ "${OFFLINE:-false}" == true ]]; then
            stop_spinner "fail" "Flynn repository missing (offline mode)"
            return 1
        fi

        # Retry loop for network issues
        while [[ $retry_count -lt $max_retries ]]; do
            if git clone --depth 1 "$repo_url" "$FLYNN_DIR" > /dev/null 2>&1; then
                clone_result=0
                break
            else
                clone_result=1
                ((retry_count++))
                if [[ $retry_count -lt $max_retries ]]; then
                    log_warn "Clone attempt $retry_count failed, retrying..."
                    sleep 2
                fi
            fi
        done

        if [[ $clone_result -eq 0 ]]; then
            # Verify the clone was successful
            if [[ -f "${FLYNN_DIR}/package.json" ]]; then
                stop_spinner "ok" "Flynn repository cloned"
            else
                stop_spinner "fail" "Repository cloned but appears incomplete"
                rm -rf "$FLYNN_DIR"
                return 1
            fi
        else
            stop_spinner "fail" "Failed to clone repository after $max_retries attempts"
            return 1
        fi
    else
        # Update existing repository
        if [[ "${OFFLINE:-false}" != true ]]; then
            if [[ -d "${FLYNN_DIR}/.git" ]]; then
                (cd "$FLYNN_DIR" && git fetch origin main --depth 1 > /dev/null 2>&1 && \
                 git reset --hard origin/main > /dev/null 2>&1) || true
            fi
        fi
        stop_spinner "ok" "Flynn repository up to date"
    fi
    return 0
}

_install_flynn_dependencies() {
    start_spinner "Installing dependencies..."

    # Configure pnpm
    cat > "$FLYNN_DIR/.npmrc" << 'EOF'
enable-pre-post-scripts=true
ignore-scripts=false
EOF

    local install_result=0
    if [[ "${OFFLINE:-false}" == true ]]; then
        (cd "$FLYNN_DIR" && pnpm install --offline > /dev/null 2>&1) || install_result=$?
    else
        (cd "$FLYNN_DIR" && pnpm install > /dev/null 2>&1) || install_result=$?
    fi

    if [[ $install_result -eq 0 ]]; then
        stop_spinner "ok" "Dependencies installed"
        return 0
    else
        stop_spinner "fail" "Failed to install dependencies"
        return 1
    fi
}

_install_python_packages() {
    if [[ "${INSTALL_MODE:-full}" != "full" ]]; then
        return 0
    fi

    start_spinner "Installing Python packages..."

    local python_result=0
    if [[ "${OFFLINE:-false}" == true ]]; then
        (cd "$FLYNN_DIR/packages/python" && uv venv > /dev/null 2>&1 && UV_PROJECT_ENVIRONMENT=.venv uv pip install -e . --offline > /dev/null 2>&1) || python_result=$?
    else
        (cd "$FLYNN_DIR/packages/python" && uv venv > /dev/null 2>&1 && UV_PROJECT_ENVIRONMENT=.venv uv pip install -e . > /dev/null 2>&1) || python_result=$?
    fi

    if [[ $python_result -eq 0 ]]; then
        stop_spinner "ok" "Python packages installed"
    else
        stop_spinner "warn" "Python packages installation failed (optional)"
    fi
}

_build_flynn_packages() {
    start_spinner "Building packages..."

    if (cd "$FLYNN_DIR" && pnpm build > /dev/null 2>&1); then
        stop_spinner "ok" "Packages built"
        return 0
    else
        stop_spinner "fail" "Failed to build packages"
        return 1
    fi
}

#!/usr/bin/env bash
set -euo pipefail

# Flynn Bootstrap Installer - Modern Edition
# 100% user-local installation (no sudo required)
# Usage: curl -fsSL https://raw.githubusercontent.com/reze83/Flynn-Project/main/install.sh | bash

FLYNN_VERSION="1.0.0"
NODE_VERSION="22"
PYTHON_VERSION="3.11"

# XDG-compliant paths
LOCAL_BIN="${HOME}/.local/bin"
LOCAL_SHARE="${HOME}/.local/share"
FLYNN_DIR="${LOCAL_SHARE}/flynn"

# Colors (minimal palette)
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

# Braille spinner frames
SPINNER_FRAMES=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")
SPINNER_PID=""

# ─────────────────────────────────────────
# Spinner Functions
# ─────────────────────────────────────────

start_spinner() {
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
    local status="$1"
    local msg="$2"
    [[ -n "$SPINNER_PID" ]] && kill "$SPINNER_PID" 2>/dev/null
    wait "$SPINNER_PID" 2>/dev/null || true
    SPINNER_PID=""

    if [[ "$status" == "ok" ]]; then
        printf "\r  ${GREEN}✓${NC} %-40s\n" "$msg"
    elif [[ "$status" == "warn" ]]; then
        printf "\r  ${YELLOW}!${NC} %-40s\n" "$msg"
    elif [[ "$status" == "skip" ]]; then
        printf "\r  ${DIM}○${NC} %-40s\n" "$msg"
    else
        printf "\r  ${RED}✗${NC} %-40s\n" "$msg"
    fi
}

# ─────────────────────────────────────────
# Output Functions
# ─────────────────────────────────────────

print_header() {
    echo ""
    echo -e "  ${BOLD}Flynn${NC} ${DIM}v${FLYNN_VERSION}${NC}"
    echo -e "  ${DIM}AI Agent Orchestrator${NC}"
    echo ""
}

print_step() {
    local current="$1"
    local total="$2"
    local msg="$3"
    echo -e "\n  ${DIM}[$current/$total]${NC} ${BOLD}$msg${NC}"
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

# ─────────────────────────────────────────
# PATH Management
# ─────────────────────────────────────────

ensure_local_bin_in_path() {
    mkdir -p "$LOCAL_BIN"
    export PATH="$LOCAL_BIN:$PATH"

    # Add to shell config if not present
    local shell_rc=""
    if [[ -f "$HOME/.zshrc" ]]; then
        shell_rc="$HOME/.zshrc"
    elif [[ -f "$HOME/.bashrc" ]]; then
        shell_rc="$HOME/.bashrc"
    fi

    if [[ -n "$shell_rc" ]] && ! grep -q '\.local/bin' "$shell_rc" 2>/dev/null; then
        cat >> "$shell_rc" << 'EOF'

# Added by Flynn installer
export PATH="$HOME/.local/bin:$PATH"
EOF
    fi
}

# ─────────────────────────────────────────
# OS Detection
# ─────────────────────────────────────────

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

# ─────────────────────────────────────────
# Check Functions
# ─────────────────────────────────────────

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

# ─────────────────────────────────────────
# Install Functions (all user-local)
# ─────────────────────────────────────────

install_fnm() {
    start_spinner "Installing fnm..."

    # Install fnm to ~/.local/share/fnm
    curl -fsSL https://fnm.vercel.app/install | bash -s -- --install-dir "$LOCAL_SHARE/fnm" --skip-shell > /dev/null 2>&1

    # Symlink to local bin
    ln -sf "$LOCAL_SHARE/fnm/fnm" "$LOCAL_BIN/fnm" 2>/dev/null || true

    # Add fnm to current session
    export PATH="$LOCAL_SHARE/fnm:$PATH"
    eval "$(fnm env)" 2>/dev/null || true

    # Add to shell config
    local shell_rc=""
    if [[ -f "$HOME/.zshrc" ]]; then
        shell_rc="$HOME/.zshrc"
    elif [[ -f "$HOME/.bashrc" ]]; then
        shell_rc="$HOME/.bashrc"
    fi

    if [[ -n "$shell_rc" ]] && ! grep -q 'fnm env' "$shell_rc" 2>/dev/null; then
        cat >> "$shell_rc" << 'EOF'

# fnm (Fast Node Manager)
export PATH="$HOME/.local/share/fnm:$PATH"
eval "$(fnm env)"
EOF
    fi

    stop_spinner "ok" "fnm $(fnm --version 2>/dev/null | cut -d' ' -f2 || echo 'installed')"
}

install_node() {
    start_spinner "Installing Node.js v${NODE_VERSION}..."

    # Ensure fnm is available
    export PATH="$LOCAL_SHARE/fnm:$LOCAL_BIN:$PATH"
    eval "$(fnm env)" 2>/dev/null || true

    fnm install "$NODE_VERSION" > /dev/null 2>&1
    fnm use "$NODE_VERSION" > /dev/null 2>&1
    fnm default "$NODE_VERSION" > /dev/null 2>&1

    stop_spinner "ok" "Node.js $(node -v 2>/dev/null || echo "v$NODE_VERSION")"
}

install_pnpm() {
    start_spinner "Installing pnpm..."

    # Try corepack first (comes with Node)
    if command -v corepack &> /dev/null; then
        corepack enable > /dev/null 2>&1 || true
        corepack prepare pnpm@latest --activate > /dev/null 2>&1 || npm install -g pnpm > /dev/null 2>&1
    else
        npm install -g pnpm > /dev/null 2>&1
    fi

    stop_spinner "ok" "pnpm $(pnpm -v 2>/dev/null || echo 'installed')"
}

install_uv() {
    start_spinner "Installing uv..."

    curl -LsSf https://astral.sh/uv/install.sh 2>/dev/null | sh > /dev/null 2>&1

    # uv installs to ~/.local/bin by default
    export PATH="$LOCAL_BIN:$PATH"

    stop_spinner "ok" "uv $(uv --version 2>/dev/null | cut -d' ' -f2 || echo 'installed')"
}

install_python() {
    start_spinner "Installing Python ${PYTHON_VERSION}..."

    # Use uv to install Python (no sudo needed!)
    uv python install "$PYTHON_VERSION" > /dev/null 2>&1

    local pyver=$(uv python find "$PYTHON_VERSION" 2>/dev/null | xargs -I{} {} --version 2>/dev/null | cut -d' ' -f2 || echo "$PYTHON_VERSION")
    stop_spinner "ok" "Python $pyver"
}

install_claude_code() {
    start_spinner "Installing Claude Code..."

    # Install locally using npm (fnm's node)
    npm install -g @anthropic-ai/claude-code > /dev/null 2>&1

    stop_spinner "ok" "Claude Code $(claude --version 2>/dev/null || echo 'installed')"
}

# ─────────────────────────────────────────
# Claude Auth Selection
# ─────────────────────────────────────────

select_claude_auth() {
    echo -e "  ${BOLD}How do you use Claude?${NC}"
    echo ""
    echo -e "    ${GREEN}●${NC} ${BOLD}Pro/Max Plan${NC}"
    echo -e "      ${DIM}Anthropic subscription (no API key needed)${NC}"
    echo ""
    echo -e "    ${DIM}○${NC} API Key"
    echo -e "      ${DIM}Pay-as-you-go with ANTHROPIC_API_KEY${NC}"
    echo ""

    while true; do
        echo -ne "  ${DIM}Enter choice${NC} [${GREEN}1${NC}/${DIM}2${NC}]: "
        read -r choice
        case $choice in
            1|""|pro|Pro)
                CLAUDE_AUTH="subscription"
                echo -e "  ${DIM}→ Using Pro/Max subscription${NC}"
                break
                ;;
            2|api|API)
                CLAUDE_AUTH="apikey"
                echo -e "  ${DIM}→ Using API Key${NC}"
                echo ""
                setup_api_key
                break
                ;;
            *)
                echo -e "  ${RED}Invalid choice${NC}"
                ;;
        esac
    done
}

setup_api_key() {
    # Check if already set
    if [[ -n "${ANTHROPIC_API_KEY:-}" ]]; then
        local masked="${ANTHROPIC_API_KEY:0:7}...${ANTHROPIC_API_KEY: -4}"
        echo -e "  ${GREEN}✓${NC} API Key found: ${DIM}$masked${NC}"
        return
    fi

    echo -ne "  ${DIM}Enter API Key:${NC} "
    read -rs api_key
    echo ""

    if [[ -z "$api_key" ]]; then
        echo -e "  ${YELLOW}!${NC} ${DIM}Skipped - set ANTHROPIC_API_KEY later${NC}"
        return
    fi

    # Add to shell config
    local shell_rc=""
    if [[ -f "$HOME/.zshrc" ]]; then
        shell_rc="$HOME/.zshrc"
    elif [[ -f "$HOME/.bashrc" ]]; then
        shell_rc="$HOME/.bashrc"
    fi

    if [[ -n "$shell_rc" ]]; then
        if ! grep -q "ANTHROPIC_API_KEY" "$shell_rc" 2>/dev/null; then
            echo "" >> "$shell_rc"
            echo "# Claude API Key (added by Flynn installer)" >> "$shell_rc"
            echo "export ANTHROPIC_API_KEY=\"$api_key\"" >> "$shell_rc"
        fi
        export ANTHROPIC_API_KEY="$api_key"
        local masked="${api_key:0:7}...${api_key: -4}"
        echo -e "  ${GREEN}✓${NC} API Key saved to ${DIM}$(basename "$shell_rc")${NC}"
    else
        export ANTHROPIC_API_KEY="$api_key"
        echo -e "  ${YELLOW}!${NC} ${DIM}Set for this session only${NC}"
    fi
}

# ─────────────────────────────────────────
# Mode Selection
# ─────────────────────────────────────────

select_mode() {
    echo -e "  ${BOLD}Select installation mode${NC}"
    echo ""
    echo -e "    ${GREEN}●${NC} ${BOLD}Full${NC} ${DIM}(recommended)${NC}"
    echo -e "      ${DIM}Node.js, pnpm, Python, uv${NC}"
    echo ""
    echo -e "    ${DIM}○${NC} Minimal"
    echo -e "      ${DIM}Node.js, pnpm only${NC}"
    echo ""

    while true; do
        echo -ne "  ${DIM}Enter choice${NC} [${GREEN}1${NC}/${DIM}2${NC}]: "
        read -r choice
        case $choice in
            1|""|full|Full)
                INSTALL_MODE="full"
                echo -e "  ${DIM}→ Full installation${NC}"
                break
                ;;
            2|minimal|Minimal)
                INSTALL_MODE="minimal"
                echo -e "  ${DIM}→ Minimal installation${NC}"
                break
                ;;
            *)
                echo -e "  ${RED}Invalid choice${NC}"
                ;;
        esac
    done
}

# ─────────────────────────────────────────
# Main
# ─────────────────────────────────────────

main() {
    print_header

    OS=$(detect_os)
    echo -e "  ${DIM}Detected: $OS${NC}"
    echo ""

    # ─── Prerequisites Check ───
    echo -e "  ${BOLD}Checking prerequisites...${NC}"

    if ! check_git; then
        echo ""
        print_fail "Git not found"
        echo ""
        echo -e "  ${DIM}Git is required. Install it with:${NC}"
        case "$OS" in
            linux|wsl)
                echo -e "    ${CYAN}sudo apt install git${NC}  ${DIM}(Debian/Ubuntu)${NC}"
                echo -e "    ${CYAN}sudo dnf install git${NC}  ${DIM}(Fedora)${NC}"
                ;;
            macos)
                echo -e "    ${CYAN}xcode-select --install${NC}"
                ;;
        esac
        echo ""
        echo -e "  ${DIM}Then run this installer again.${NC}"
        echo ""
        exit 1
    fi
    print_done "Git $(git --version | cut -d' ' -f3)"
    echo ""

    # ─── Setup local bin ───
    ensure_local_bin_in_path

    # ─── Claude Auth Selection ───
    select_claude_auth
    echo ""

    # ─── Mode Selection ───
    select_mode

    # Determine total steps
    if [[ "$INSTALL_MODE" == "full" ]]; then
        TOTAL_STEPS=6
    else
        TOTAL_STEPS=5
    fi

    CURRENT_STEP=1

    # ─── Step 1: fnm ───
    print_step "$CURRENT_STEP" "$TOTAL_STEPS" "Node.js Runtime"
    ((CURRENT_STEP++))

    if ! check_fnm; then
        install_fnm
    else
        print_done "fnm $(fnm --version 2>/dev/null | cut -d' ' -f2 || echo 'installed')"
    fi

    # Ensure fnm is loaded
    export PATH="$LOCAL_SHARE/fnm:$LOCAL_BIN:$PATH"
    eval "$(fnm env 2>/dev/null)" || true

    if ! check_node; then
        install_node
    else
        print_done "Node.js $(node -v)"
    fi

    if ! check_pnpm; then
        install_pnpm
    else
        print_done "pnpm v$(pnpm -v)"
    fi

    # ─── Step 2: Python (Full mode only) ───
    if [[ "$INSTALL_MODE" == "full" ]]; then
        print_step "$CURRENT_STEP" "$TOTAL_STEPS" "Python Runtime"
        ((CURRENT_STEP++))

        if ! check_uv; then
            install_uv
        else
            print_done "uv $(uv --version 2>/dev/null | cut -d' ' -f2 || echo 'installed')"
        fi

        if ! check_python; then
            install_python
        else
            local pyver=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
            print_done "Python $pyver"
        fi
    fi

    # ─── Step 3: Claude Code ───
    print_step "$CURRENT_STEP" "$TOTAL_STEPS" "Claude Code"
    ((CURRENT_STEP++))

    if ! check_claude_code; then
        install_claude_code
    else
        print_done "Claude Code $(claude --version 2>/dev/null || echo 'installed')"
    fi

    # ─── Step 4: Flynn Packages ───
    print_step "$CURRENT_STEP" "$TOTAL_STEPS" "Flynn Packages"
    ((CURRENT_STEP++))

    start_spinner "Cloning Flynn repository..."
    mkdir -p "$LOCAL_SHARE"
    if [[ ! -d "$FLYNN_DIR" ]]; then
        git clone --depth 1 https://github.com/reze83/Flynn-Project.git "$FLYNN_DIR" > /dev/null 2>&1
    else
        (cd "$FLYNN_DIR" && git pull --ff-only > /dev/null 2>&1) || true
    fi
    stop_spinner "ok" "Flynn repository"

    start_spinner "Installing dependencies..."
    (cd "$FLYNN_DIR" && pnpm install > /dev/null 2>&1)
    stop_spinner "ok" "@mastra/core"

    print_done "@mastra/agent"
    print_done "@flynn/agents"
    print_done "@flynn/tools"

    if [[ "$INSTALL_MODE" == "full" ]]; then
        print_done "@flynn/python-bridge"
    fi

    start_spinner "Building packages..."
    (cd "$FLYNN_DIR" && pnpm build > /dev/null 2>&1)
    stop_spinner "ok" "Packages built"

    # ─── Step 5: Configuration ───
    print_step "$CURRENT_STEP" "$TOTAL_STEPS" "Configuration"

    start_spinner "Registering /flynn command..."

    # Create Claude Code MCP config
    CLAUDE_CONFIG_DIR="${HOME}/.config/claude-code"
    mkdir -p "$CLAUDE_CONFIG_DIR"

    cat > "$CLAUDE_CONFIG_DIR/mcp.json" << EOF
{
  "servers": {
    "flynn": {
      "command": "node",
      "args": ["${FLYNN_DIR}/apps/server/dist/index.js"]
    }
  }
}
EOF
    stop_spinner "ok" "/flynn command registered"

    # ─── Success ───
    echo ""
    echo -e "  ${GREEN}${BOLD}Ready!${NC}"
    echo ""
    echo -e "  ${DIM}Installation:${NC} ${CYAN}~/.local/share/flynn${NC}"
    echo -e "  ${DIM}Config:${NC}       ${CYAN}~/.config/claude-code${NC}"
    echo ""
    echo -e "  ${DIM}Next:${NC} Use ${CYAN}/flynn${NC} in Claude Code"

    if [[ "$INSTALL_MODE" == "minimal" ]]; then
        echo ""
        echo -e "  ${DIM}Tip:${NC}  Run installer with Full mode for Data/ML"
    fi

    echo ""
    echo -e "  ${DIM}Note: Restart your terminal or run:${NC}"
    echo -e "    ${CYAN}source ~/.bashrc${NC}  ${DIM}or${NC}  ${CYAN}source ~/.zshrc${NC}"
    echo ""
}

main "$@"

#!/usr/bin/env bash
set -euo pipefail

# Flynn Bootstrap Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/reze83/Flynn-Project/main/install.sh | bash

FLYNN_VERSION="1.0.0"
MIN_NODE_VERSION="20"
MIN_PYTHON_VERSION="3.11"
REPO_URL="https://github.com/reze83/Flynn-Project"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo ""
echo -e "${BOLD}"
echo "╔═══════════════════════════════════════════╗"
echo "║     Flynn Bootstrap Installer v${FLYNN_VERSION}       ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# Detect OS
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

OS=$(detect_os)
log_info "Detected OS: $OS"
echo ""

# ============================================
# Installation Mode Selection
# ============================================

select_mode() {
    echo -e "${CYAN}Select installation mode:${NC}"
    echo ""
    echo -e "  ${BOLD}1)${NC} ${GREEN}Full${NC}     - All features (Node.js, pnpm, Python, uv, Git)"
    echo -e "  ${BOLD}2)${NC} ${YELLOW}Minimal${NC}  - Basic only (Node.js, pnpm)"
    echo ""

    while true; do
        read -p "Enter choice [1/2]: " choice
        case $choice in
            1|full|Full)
                echo ""
                log_info "Full installation selected"
                INSTALL_MODE="full"
                break
                ;;
            2|minimal|Minimal)
                echo ""
                log_info "Minimal installation selected"
                INSTALL_MODE="minimal"
                break
                ;;
            *)
                echo -e "${RED}Invalid choice. Please enter 1 or 2.${NC}"
                ;;
        esac
    done
    echo ""
}

# ============================================
# Check Functions
# ============================================

check_node() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge "$MIN_NODE_VERSION" ]; then
            log_success "Node.js $(node -v)"
            return 0
        else
            log_warn "Node.js $(node -v) found, but v${MIN_NODE_VERSION}+ required"
            return 1
        fi
    else
        log_warn "Node.js not found"
        return 1
    fi
}

check_pnpm() {
    if command -v pnpm &> /dev/null; then
        log_success "pnpm v$(pnpm -v)"
        return 0
    else
        log_warn "pnpm not found"
        return 1
    fi
}

check_python() {
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
        if python3 -c "import sys; exit(0 if sys.version_info >= (3, 11) else 1)" 2>/dev/null; then
            log_success "Python $PYTHON_VERSION"
            return 0
        else
            log_warn "Python $PYTHON_VERSION found, but ${MIN_PYTHON_VERSION}+ required"
            return 1
        fi
    else
        log_warn "Python not found"
        return 1
    fi
}

check_uv() {
    if command -v uv &> /dev/null; then
        log_success "uv $(uv --version | cut -d' ' -f2)"
        return 0
    else
        log_warn "uv not found"
        return 1
    fi
}

check_git() {
    if command -v git &> /dev/null; then
        log_success "Git $(git --version | cut -d' ' -f3)"
        return 0
    else
        log_warn "Git not found"
        return 1
    fi
}

# ============================================
# Install Functions
# ============================================

install_node() {
    log_info "Installing Node.js v${MIN_NODE_VERSION}..."

    case "$OS" in
        linux|wsl)
            if command -v apt-get &> /dev/null; then
                curl -fsSL https://deb.nodesource.com/setup_${MIN_NODE_VERSION}.x | sudo -E bash -
                sudo apt-get install -y nodejs
            elif command -v dnf &> /dev/null; then
                curl -fsSL https://rpm.nodesource.com/setup_${MIN_NODE_VERSION}.x | sudo bash -
                sudo dnf install -y nodejs
            else
                curl -fsSL https://raw.githubusercontent.com/tj/n/master/bin/n | bash -s lts
            fi
            ;;
        macos)
            if command -v brew &> /dev/null; then
                brew install node@${MIN_NODE_VERSION}
            else
                curl -fsSL https://raw.githubusercontent.com/tj/n/master/bin/n | bash -s lts
            fi
            ;;
        *)
            log_error "Unsupported OS. Please install Node.js manually."
            exit 1
            ;;
    esac

    log_success "Node.js installed"
}

install_pnpm() {
    log_info "Installing pnpm..."
    corepack enable
    corepack prepare pnpm@latest --activate
    log_success "pnpm installed"
}

install_python() {
    log_info "Installing Python ${MIN_PYTHON_VERSION}..."

    case "$OS" in
        linux|wsl)
            if command -v apt-get &> /dev/null; then
                sudo apt-get update
                sudo apt-get install -y python3.11 python3.11-venv python3-pip
            elif command -v dnf &> /dev/null; then
                sudo dnf install -y python3.11
            fi
            ;;
        macos)
            if command -v brew &> /dev/null; then
                brew install python@3.11
            fi
            ;;
        *)
            log_error "Please install Python ${MIN_PYTHON_VERSION}+ manually"
            return 1
            ;;
    esac

    log_success "Python installed"
}

install_uv() {
    log_info "Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.cargo/bin:$PATH"
    log_success "uv installed"
}

install_git() {
    log_info "Installing Git..."

    case "$OS" in
        linux|wsl)
            if command -v apt-get &> /dev/null; then
                sudo apt-get install -y git
            elif command -v dnf &> /dev/null; then
                sudo dnf install -y git
            fi
            ;;
        macos)
            if command -v brew &> /dev/null; then
                brew install git
            fi
            ;;
        *)
            log_error "Please install Git manually"
            return 1
            ;;
    esac

    log_success "Git installed"
}

# ============================================
# Main Installation Flow
# ============================================

main() {
    # Select installation mode
    select_mode

    echo -e "${CYAN}Checking dependencies...${NC}"
    echo ""

    # === Required: Node.js ===
    if ! check_node; then
        install_node
        check_node || { log_error "Failed to install Node.js"; exit 1; }
    fi

    # === Required: pnpm ===
    if ! check_pnpm; then
        install_pnpm
        check_pnpm || { log_error "Failed to install pnpm"; exit 1; }
    fi

    # === Full Mode: Additional packages ===
    if [ "$INSTALL_MODE" = "full" ]; then
        echo ""
        echo -e "${CYAN}Installing full package...${NC}"
        echo ""

        # Git
        if ! check_git; then
            install_git
        fi

        # Python
        if ! check_python; then
            install_python
        fi

        # uv
        if ! check_uv; then
            install_uv
        fi
    fi

    # === Run Flynn Bootstrap ===
    echo ""
    log_info "Running Flynn bootstrap..."
    echo ""

    if npx @flynn/bootstrap "$@"; then
        echo ""
        echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║     Flynn installation complete! 🎉       ║${NC}"
        echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
        echo ""
        echo "Next steps:"
        echo "  1. Ensure Claude Code is installed with Pro/Max plan or API key"
        echo "  2. Use /flynn in Claude Code to interact with Flynn"
        echo ""

        if [ "$INSTALL_MODE" = "minimal" ]; then
            echo -e "${YELLOW}Note: You installed minimal mode.${NC}"
            echo "For Data/ML features, install Python 3.11+ and uv manually."
            echo ""
        fi
    else
        log_error "Flynn bootstrap failed"
        exit 1
    fi
}

# Run main with all arguments
main "$@"

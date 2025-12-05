#!/usr/bin/env bash
set -euo pipefail

# Flynn Bootstrap Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/reze83/Flynn-Project/main/install.sh | bash

FLYNN_VERSION="1.0.0"
MIN_NODE_VERSION="20"
REPO_URL="https://github.com/reze83/Flynn-Project"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
echo "╔════════════════════════════════════════╗"
echo "║   Flynn Bootstrap Installer v${FLYNN_VERSION}      ║"
echo "╚════════════════════════════════════════╝"
echo ""

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

# Check for Node.js
check_node() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge "$MIN_NODE_VERSION" ]; then
            log_success "Node.js v$(node -v) found"
            return 0
        else
            log_warn "Node.js v$(node -v) found, but v${MIN_NODE_VERSION}+ required"
            return 1
        fi
    else
        log_warn "Node.js not found"
        return 1
    fi
}

# Install Node.js
install_node() {
    log_info "Installing Node.js v${MIN_NODE_VERSION}..."

    case "$OS" in
        linux|wsl)
            # Use NodeSource for Linux/WSL
            if command -v apt-get &> /dev/null; then
                curl -fsSL https://deb.nodesource.com/setup_${MIN_NODE_VERSION}.x | sudo -E bash -
                sudo apt-get install -y nodejs
            elif command -v dnf &> /dev/null; then
                curl -fsSL https://rpm.nodesource.com/setup_${MIN_NODE_VERSION}.x | sudo bash -
                sudo dnf install -y nodejs
            else
                # Fallback to n
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

# Check for pnpm
check_pnpm() {
    if command -v pnpm &> /dev/null; then
        log_success "pnpm v$(pnpm -v) found"
        return 0
    else
        log_warn "pnpm not found"
        return 1
    fi
}

# Install pnpm
install_pnpm() {
    log_info "Installing pnpm..."
    corepack enable
    corepack prepare pnpm@latest --activate
    log_success "pnpm installed"
}

# Main installation flow
main() {
    # Step 1: Ensure Node.js is installed
    if ! check_node; then
        install_node
        if ! check_node; then
            log_error "Failed to install Node.js"
            exit 1
        fi
    fi

    # Step 2: Ensure pnpm is installed
    if ! check_pnpm; then
        install_pnpm
        if ! check_pnpm; then
            log_error "Failed to install pnpm"
            exit 1
        fi
    fi

    # Step 3: Run npx @flynn/bootstrap
    log_info "Running Flynn bootstrap..."
    echo ""

    if npx @flynn/bootstrap "$@"; then
        echo ""
        log_success "Flynn installation complete!"
        echo ""
        echo "Next steps:"
        echo "  1. Set your ANTHROPIC_API_KEY environment variable"
        echo "  2. Use /flynn in Claude Code to interact with Flynn"
        echo ""
    else
        log_error "Flynn bootstrap failed"
        exit 1
    fi
}

# Run main with all arguments
main "$@"

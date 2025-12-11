# Flynn Installer

Automated installation script for Flynn AI Orchestrator. Handles dependencies, building, Claude Code configuration, and verification.

## Quick Start

```bash
# Download and run
curl -fsSL https://raw.githubusercontent.com/reze83/Flynn-Project/main/install-flynn.sh -o install-flynn.sh
chmod +x install-flynn.sh
./install-flynn.sh
```

## Architecture

The installer follows a modular architecture with separate concerns:

```
installer/
├── install-flynn.sh       # Main entry point
├── config/
│   └── constants.sh       # Configuration and constants
└── lib/
    ├── common.sh          # Logging, output, user input
    ├── environment.sh     # Environment detection
    ├── installers.sh      # Dependency installers (Node, pnpm, Python, Puppeteer)
    ├── prerequisites.sh   # Prerequisite checks
    ├── config.sh          # Claude Code configuration
    ├── verify.sh          # Installation verification
    └── rollback.sh        # Rollback and recovery
```

### Design Patterns

- **Facade Pattern** (`lib/common.sh`) - Simplified logging interface
- **Template Method** (`lib/verify.sh`) - Standardized verification process
- **Strategy Pattern** (`lib/installers.sh`) - Different installation strategies per OS
- **Command Pattern** (`lib/rollback.sh`) - Undoable operations

## Features

### Error Handling

Enhanced error handler with comprehensive debugging:

```bash
# Stack traces in debug mode
DEBUG=true ./install-flynn.sh

# Error output includes:
# - Failed command
# - File location (install-flynn.sh:line)
# - Exit code
# - Stack trace (when DEBUG=true)
# - Automatic rollback
```

### Signal Handling

Graceful interrupt handling (Ctrl+C, SIGTERM):

- Stops spinner processes cleanly
- Prompts for rollback in interactive mode
- Logs interruption signals
- Prevents partial installations

### Rollback System

Automatic recovery from failed installations:

```bash
# List available rollback points
./install-flynn.sh --rollback

# Automatic rollback on error
# Manual rollback on interrupt (interactive prompt)
```

**Rollback points created at:**
- Before dependency installation
- Before building packages
- Before configuration changes

## Usage

### Installation Modes

```bash
# Interactive installation (default)
./install-flynn.sh

# Non-interactive installation
./install-flynn.sh --non-interactive

# Skip Puppeteer dependencies
./install-flynn.sh --without-puppeteer

# Dry run (show what would be done)
./install-flynn.sh --dry-run
```

### Operations

```bash
# Install Flynn
./install-flynn.sh --install

# Update existing installation
./install-flynn.sh --update

# Uninstall Flynn
./install-flynn.sh --uninstall

# Verify installation
./install-flynn.sh --verify

# Detailed verification
./install-flynn.sh --verify-detailed

# Rollback to previous state
./install-flynn.sh --rollback
```

### Debugging

```bash
# Enable debug output
DEBUG=true ./install-flynn.sh

# Outputs:
# - Debug messages with [DEBUG] prefix
# - Stack traces on errors
# - Detailed command execution logs

# Check installation log
tail -f ~/.flynn/logs/install.log
```

## Module Reference

### config/constants.sh

Defines global constants and configuration:

- **Paths**: `FLYNN_DIR`, `FLYNN_LOG_DIR`, `CLAUDE_JSON`, etc.
- **Versions**: Minimum required versions for dependencies
- **Colors**: Terminal color codes for output
- **Spinner**: Animation frames for progress indicators
- **MCP Servers**: List of expected MCP server configurations

### lib/common.sh

Logging, output formatting, and user interaction:

**Functions:**
- `setup_logging()` - Initialize log directory and rotation
- `log_*()` - Logging functions (info, step, success, warn, error)
- `die()` - Exit with error message
- `start_spinner()` / `stop_spinner()` - Progress indicators
- `print_*()` - Output formatting (header, step, done, warn, fail, info)
- `prompt_user()` - User input with default values
- `prompt_secret()` - Masked input for API keys

### lib/environment.sh

Environment detection and validation:

**Functions:**
- `detect_os()` - Detect operating system (linux, macos, wsl)
- `detect_arch()` - Detect CPU architecture (x86_64, arm64, aarch64)
- `get_installed_version()` - Check currently installed Flynn version
- `print_environment_info()` - Display system information

### lib/installers.sh

Dependency installation:

**Functions:**
- `install_node()` - Install Node.js via fnm
- `install_pnpm()` - Install pnpm package manager
- `install_python()` - Install Python via uv
- `install_puppeteer_deps()` - Install Puppeteer system dependencies (Linux/WSL)
- `verify_puppeteer()` - Test Puppeteer functionality
- `clone_repository()` - Clone Flynn repository with retry logic

**Features:**
- Platform-specific installation strategies
- Version checking and validation
- Retry logic for network operations
- Dry-run support

### lib/prerequisites.sh

Prerequisite checks:

**Functions:**
- `check_prerequisites()` - Verify all required tools are installed
- `check_disk_space()` - Ensure sufficient disk space (500MB minimum)
- `check_claude_cli()` - Verify Claude Code CLI is available

### lib/config.sh

Claude Code configuration management:

**Functions:**
- `configure_claude()` - Main configuration orchestrator
- `setup_mcp_server()` - Add Flynn to `~/.claude.json`
- `setup_permissions()` - Configure tool permissions in `~/.claude/settings.json`
- `setup_slash_command()` - Install `/flynn` command
- `install_mcp_servers()` - Install additional MCP servers (optional)

**Configuration:**
- MCP server registration with absolute paths
- Tool permission whitelisting
- Slash command markdown files
- External MCP server integration

### lib/verify.sh

Installation verification:

**Functions:**
- `verify_installation()` - Basic verification checks
- `verify_detailed()` - Comprehensive system verification

**Checks:**
- Flynn directory existence
- MCP server registration and path validation
- Permission configuration
- Slash command installation
- Version detection
- Environment variables
- Package runners (npx, uvx, node, pnpm)

### lib/rollback.sh

Rollback and recovery:

**Functions:**
- `create_rollback_point()` - Save current state before operations
- `execute_rollback()` - Restore previous state
- `cleanup_rollback_points()` - Remove old backups (keep last 3)
- `list_rollback_points()` - Display available rollback points

**Features:**
- State preservation before critical operations
- Selective rollback to specific points
- Automatic cleanup of old backups
- Safe array processing for filenames with spaces

## Error Recovery

### Common Issues

**Installation Fails Midway:**
```bash
# Automatic rollback is triggered
# Or manually rollback:
./install-flynn.sh --rollback
```

**Interrupted Installation (Ctrl+C):**
```bash
# Interactive prompt asks:
# "Rollback changes? [Y/n]"
# Choose Y to restore previous state
```

**MCP Server Path Issues:**
```bash
# Verify and fix:
./install-flynn.sh --verify-detailed

# Check configured path vs actual path
# Re-run configuration:
./install-flynn.sh --update
```

**Puppeteer Dependencies Missing:**
```bash
# Linux/WSL only - install manually:
sudo apt-get update
sudo apt-get install -y \
  ca-certificates fonts-liberation \
  libappindicator3-1 libasound2 libatk-bridge2.0-0 \
  libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 \
  libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 \
  libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 \
  libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
  libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 \
  libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils

# Or skip Puppeteer:
./install-flynn.sh --without-puppeteer
```

### Debug Mode

```bash
# Enable comprehensive debugging:
DEBUG=true ./install-flynn.sh

# Outputs:
# - All function calls and returns
# - Variable values at key points
# - Stack traces on errors
# - Command execution details
# - Log file: ~/.flynn/logs/install.log
```

## Development

### Testing

```bash
# Dry run (no changes made)
./install-flynn.sh --dry-run

# Test specific operation
./install-flynn.sh --verify --dry-run
./install-flynn.sh --uninstall --dry-run
```

### Syntax Validation

```bash
# Validate all shell scripts
for script in install-flynn.sh config/*.sh lib/*.sh; do
  bash -n "$script" && echo "✓ $script" || echo "✗ $script"
done
```

### Adding New Functionality

**Adding a new installer module:**

1. Create new file in `lib/`:
   ```bash
   # lib/mymodule.sh
   [[ -n "${_MYMODULE_SOURCED:-}" ]] && return 0
   readonly _MYMODULE_SOURCED=1

   my_function() {
       # Implementation
   }
   ```

2. Source in `install-flynn.sh`:
   ```bash
   source "${LIB_DIR}/mymodule.sh"
   ```

3. Add to appropriate workflow section

**Adding rollback points:**

```bash
create_rollback_point "Before my operation" "my_operation"

# Perform operation...

if [[ $? -ne 0 ]]; then
    execute_rollback "My operation failed"
fi
```

## Best Practices

### Coding Standards

- **Error Handling**: Always use `set -euo pipefail`
- **Logging**: Log all operations with appropriate level
- **Dry Run**: Support `DRY_RUN` variable in all operations
- **Rollback**: Create rollback points before destructive operations
- **User Feedback**: Use spinners for long operations
- **Debug Support**: Use `[[ "${DEBUG:-false}" == true ]]` for debug output

### Security

- **No root execution**: Installer uses `sudo` only when necessary
- **Path validation**: All paths are validated before use
- **Input sanitization**: User input is sanitized before shell execution
- **Secure defaults**: Fail-closed policy for all checks

## Troubleshooting

### Installation Log

```bash
# View full installation log
cat ~/.flynn/logs/install.log

# Follow in real-time
tail -f ~/.flynn/logs/install.log

# Check for errors
grep ERROR ~/.flynn/logs/install.log
```

### Verify Installation

```bash
# Quick verification
./install-flynn.sh --verify

# Detailed verification (shows all checks)
./install-flynn.sh --verify-detailed
```

### Common Errors

**"Flynn directory not found"**
- Installation incomplete or rollback executed
- Re-run: `./install-flynn.sh --install`

**"MCP server not registered"**
- Configuration step failed
- Manual fix: Edit `~/.claude.json` with Flynn MCP server entry
- Or re-run: `./install-flynn.sh --update`

**"Permissions not configured"**
- Settings file not updated
- Manual fix: Edit `~/.claude/settings.json`
- Or re-run: `./install-flynn.sh --update`

## Contributing

When modifying the installer:

1. Test with `--dry-run` first
2. Validate syntax: `bash -n install-flynn.sh`
3. Run full test suite with different configurations
4. Update this documentation
5. Update CHANGELOG.md

## References

- **Main Documentation**: [Flynn Project README](../README.md)
- **Quick Start Guide**: [docs/QUICKSTART.md](../docs/QUICKSTART.md)
- **Troubleshooting**: [docs/TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md)
- **Architecture**: [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- **Google Bash Style Guide**: Reference for coding standards

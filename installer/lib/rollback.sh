#!/usr/bin/env bash
# ============================================================================
# Module: lib/rollback.sh
# Description: Rollback and backup management system
# Author: Flynn Project
# Version: 2.0.0
# Dependencies: config/constants.sh, lib/common.sh
# ============================================================================
# Source: Google Bash Style Guide, Cursor Rules 2025
# Pattern: Command Pattern - Encapsulated rollback operations
# ============================================================================

# Prevent multiple sourcing
[[ -n "${_ROLLBACK_SOURCED:-}" ]] && return 0
readonly _ROLLBACK_SOURCED=1

# Global rollback state
ROLLBACK_POINTS=()

# ─────────────────────────────────────────────────────────────────────────────
# Rollback Point Creation
# ─────────────────────────────────────────────────────────────────────────────

create_rollback_point() {
    local description="$1"
    local timestamp
    timestamp=$(date +%s)
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

# ─────────────────────────────────────────────────────────────────────────────
# Rollback Execution
# ─────────────────────────────────────────────────────────────────────────────

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

# ─────────────────────────────────────────────────────────────────────────────
# Rollback Cleanup
# ─────────────────────────────────────────────────────────────────────────────

cleanup_rollback_points() {
    # Keep only last 3 rollback points
    local backup_dirs=()
    local dir

    # Safely read directory list into array
    while IFS= read -r -d '' dir; do
        backup_dirs+=("$dir")
    done < <(find "${FLYNN_BACKUP_DIR}" -maxdepth 1 -type d -name "rollback_*" -print0 2>/dev/null | sort -z -r)

    if [[ ${#backup_dirs[@]} -gt 3 ]]; then
        for dir in "${backup_dirs[@]:3}"; do
            rm -rf "$dir"
            log_info "Removed old rollback point: $(basename "$dir")"
        done
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
# List Rollback Points
# ─────────────────────────────────────────────────────────────────────────────

list_rollback_points() {
    echo ""
    echo -e "  ${BOLD}Available Rollback Points${NC}"
    echo ""

    local backup_dirs=()
    local dir
    local name
    local desc

    # Safely read directory list into array
    while IFS= read -r -d '' dir; do
        backup_dirs+=("$dir")
    done < <(find "${FLYNN_BACKUP_DIR}" -maxdepth 1 -type d -name "rollback_*" -print0 2>/dev/null | sort -z -r)

    if [[ ${#backup_dirs[@]} -eq 0 ]]; then
        print_info "No rollback points found"
        return 0
    fi

    for dir in "${backup_dirs[@]}"; do
        name=$(basename "$dir")
        desc=""
        [[ -f "${dir}/description.txt" ]] && desc=$(cat "${dir}/description.txt")
        echo -e "    • ${CYAN}$name${NC}: $desc"
    done
    echo ""
}

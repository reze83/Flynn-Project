#!/usr/bin/env bash

# This script installs dependencies using pnpm if available.
# If pnpm is not installed, it falls back to npm install.

set -euo pipefail

# Ensure Node.js is available; required to build and run Flynn.
if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is not installed or not in PATH. Please install Node.js (version 20+) before running this script." >&2
  exit 1
fi

if command -v pnpm >/dev/null 2>&1; then
  echo "Using pnpm to install dependencies..."
  pnpm install
  echo "Running build tasks..."
  # Build TypeScript sources and bundle packages where applicable. If these
  # commands fail, the script will exit due to set -e at the top.
  pnpm run build
  # Bundle packages for production use. This step uses tsup to emit ESM/CJS
  # bundles; if not defined in a package, it will be ignored.
  pnpm run build:bundle || true
else
  echo "pnpm not found, falling back to npm install..."
  if command -v npm >/dev/null 2>&1; then
    npm install
    echo "Running build tasks with npm..."
    npm run build || true
    npm run build:bundle || true
  else
    echo "Error: neither pnpm nor npm is installed. Please install one of them manually." >&2
    echo "You can install pnpm globally with: npm install -g pnpm" >&2
    echo "After installing, rerun this script." >&2
    exit 1
  fi
fi
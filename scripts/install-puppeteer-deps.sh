#!/bin/bash
# Puppeteer Dependencies Installation Script
# This script installs all required system libraries for Puppeteer/Chrome
#
# NOTE: Puppeteer dependencies are now installed BY DEFAULT via the main installer.
#   To skip them, use: ./install.sh --without-puppeteer
#
# This standalone script remains for convenience and backward compatibility.

set -e

echo "🐶 Installing Puppeteer/Chrome Dependencies..."
echo "================================================"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  Please do not run this script as root. Run it as your regular user."
    exit 1
fi

echo ""
echo "📦 Updating package lists..."
sudo apt-get update

echo ""
echo "📦 Installing Chrome/Chromium dependencies..."
sudo apt-get install -y \
    libnss3 \
    libatk1.0-0t64 \
    libatk-bridge2.0-0t64 \
    libcups2t64 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2t64 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgtk-3-0t64 \
    libxshmfence1 \
    libglu1-mesa

echo ""
echo "✅ Dependencies installed successfully!"
echo ""
echo "🧪 Testing Puppeteer..."

# Test if Puppeteer can now launch
cd "$(dirname "$0")/.."

# Simple test
node -e "
const puppeteer = require('puppeteer');
(async () => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    console.log('✅ Puppeteer launched successfully!');
    await browser.close();
    console.log('✅ Browser closed successfully!');
    console.log('');
    console.log('🎉 Puppeteer is ready to use!');
  } catch (error) {
    console.error('❌ Puppeteer test failed:', error.message);
    process.exit(1);
  }
})();
" 2>&1

echo ""
echo "================================================"
echo "✅ Puppeteer setup complete!"
echo ""
echo "You can now use:"
echo "  - mcp__puppeteer__puppeteer_navigate"
echo "  - mcp__puppeteer__puppeteer_screenshot"
echo "  - mcp__puppeteer__puppeteer_click"
echo "  - and all other Puppeteer tools!"

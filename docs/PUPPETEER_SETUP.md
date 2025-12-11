# Puppeteer Setup Guide

## Overview

Puppeteer requires several system libraries to run Chrome/Chromium in headless mode. This guide helps you install them.

## Quick Start (Recommended)

Run the automated installation script:

```bash
cd /path/to/Flynn-Project
./scripts/install-puppeteer-deps.sh
```

This will:
1. Install all required dependencies
2. Test Puppeteer automatically
3. Confirm everything is working

## Manual Installation

If you prefer to install manually:

```bash
sudo apt-get update

sudo apt-get install -y \
  libnss3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libasound2 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libgtk-3-0 \
  libxshmfence1 \
  libglu1-mesa
```

## Verification

After installation, verify Puppeteer works:

```bash
node -e "
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  console.log('✅ Puppeteer works!');
  await browser.close();
})();
"
```

## Testing with Flynn

Once installed, test the QA Tester agent:

```bash
/flynn test https://example.com with puppeteer
```

Or test directly via MCP:

```javascript
mcp__puppeteer__puppeteer_navigate({ url: "https://example.com" })
```

## Common Issues

### Issue: "libnss3.so: cannot open shared object file"

**Solution**: Install `libnss3`:
```bash
sudo apt-get install -y libnss3
```

### Issue: "error while loading shared libraries: libgbm.so.1"

**Solution**: Install `libgbm1`:
```bash
sudo apt-get install -y libgbm1
```

### Issue: Browser crashes immediately

**Solutions**:
1. Run in sandbox mode (less secure):
   ```javascript
   puppeteer.launch({
     headless: true,
     args: ['--no-sandbox', '--disable-setuid-sandbox']
   })
   ```

2. Install additional fonts:
   ```bash
   sudo apt-get install -y fonts-liberation
   ```

### Issue: WSL-specific problems

**Solution**: Ensure WSL has X11 support (though not needed for headless):
```bash
sudo apt-get install -y xvfb
```

## Minimal Dependencies (WSL/Headless)

For WSL or server environments, you can use a minimal set:

```bash
sudo apt-get install -y \
  libnss3 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libasound2
```

## Environment Variables

Optional Puppeteer configuration:

```bash
# Skip Chromium download (use system Chrome)
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

# Or specify custom cache directory
export PUPPETEER_CACHE_DIR=/custom/path
```

## Advanced Configuration

### Use System Chrome (instead of bundled Chromium)

1. Install Chrome:
   ```bash
   wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
   sudo dpkg -i google-chrome-stable_current_amd64.deb
   sudo apt-get install -f
   ```

2. Configure Puppeteer:
   ```javascript
   puppeteer.launch({
     executablePath: '/usr/bin/google-chrome',
     headless: true
   })
   ```

### Docker Container

If running in Docker, add to your Dockerfile:

```dockerfile
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*
```

## flynn QA Tester Agent

Once Puppeteer is working, you can use the `qa-tester` agent:

**Capabilities**:
- Navigate to URLs
- Take screenshots
- Click elements
- Fill forms
- Execute JavaScript
- Capture console logs

**Example Usage**:
```bash
/flynn test the login flow on https://myapp.com
/flynn take a screenshot of https://example.com
/flynn check if the homepage loads correctly
```

**Available MCP Tools**:
- `mcp__puppeteer__puppeteer_navigate` - Navigate to URL
- `mcp__puppeteer__puppeteer_screenshot` - Capture screenshot
- `mcp__puppeteer__puppeteer_click` - Click element
- `mcp__puppeteer__puppeteer_fill` - Fill form field
- `mcp__puppeteer__puppeteer_select` - Select dropdown option
- `mcp__puppeteer__puppeteer_hover` - Hover over element
- `mcp__puppeteer__puppeteer_evaluate` - Execute JavaScript

## Troubleshooting

### Enable Debug Logging

```bash
DEBUG=puppeteer:* node your-script.js
```

### Check Puppeteer Installation

```bash
npm list puppeteer
```

### Reinstall Puppeteer

```bash
npm uninstall puppeteer
npm install puppeteer
```

### WSL-Specific: Missing Display

If you see display errors in WSL, set:
```bash
export DISPLAY=:0
```

Though for headless mode, this shouldn't be needed.

## Support

If issues persist:

1. Check Puppeteer troubleshooting: https://pptr.dev/troubleshooting
2. Verify dependencies: `ldd $(which chrome)` (if installed)
3. Check Flynn logs: `docs/MCP_SERVER_TEST_RESULTS.md`

---

**Status**: After installation, Puppeteer should be fully operational
**Last Updated**: 2025-12-11

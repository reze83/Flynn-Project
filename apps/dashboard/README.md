# Flynn Analytics Dashboard

Web-based dashboard for visualizing Flynn usage analytics.

## Features

- **Summary Cards**: Total sessions, tokens, cost, and averages
- **Tool Usage Chart**: Bar chart of top 10 most-used tools
- **Agent Usage Chart**: Doughnut chart of agent distribution
- **Detailed Tables**: Tool and agent statistics with success rates
- **Session Details**: Current session metrics
- **Auto-Refresh**: Updates every 30 seconds
- **Demo Mode**: Works without API for testing

## Quick Start

```bash
# Navigate to dashboard directory
cd apps/dashboard

# Start the server
pnpm start
# or
npx serve -p 3001

# Open in browser
open http://localhost:3001
```

## Demo Mode

To test the dashboard without a running API, add `?demo=true` to the URL:

```
http://localhost:3001?demo=true
```

## Configuration

The dashboard looks for the API at `http://localhost:3000/api` by default.
You can override this by setting `flynn_api_url` in localStorage:

```javascript
localStorage.setItem('flynn_api_url', 'http://your-api-url/api');
```

## API Endpoints

The dashboard expects these endpoints from the Flynn MCP server:

| Endpoint | Description |
|----------|-------------|
| `GET /api/analytics?action=get-summary` | Session summary stats |
| `GET /api/analytics?action=get-tool-stats&limit=10` | Tool usage statistics |
| `GET /api/analytics?action=get-agent-stats&limit=10` | Agent usage statistics |
| `GET /api/analytics?action=get-session` | Current session details |

## Tech Stack

- **HTML/CSS/JS**: No build step required
- **Chart.js 4.x**: Via CDN
- **Dark Theme**: GitHub-inspired colors

## Screenshots

```
┌─────────────────────────────────────────────────────────────┐
│ F Flynn Analytics                      [Connected] [Refresh]│
├─────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │Sessions  │ │Tokens    │ │Cost      │ │Avg/Sess  │        │
│ │   42     │ │  1.2M    │ │ $18.45   │ │  29.4K   │        │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                                                             │
│ ┌─────────────────────┐ ┌─────────────────────┐            │
│ │ Tool Usage (Top 10) │ │ Agent Usage         │            │
│ │ ████████████        │ │     ╭────╮          │            │
│ │ ██████████          │ │   ╭─┤████├─╮        │            │
│ │ ████████            │ │   │ ╰────╯ │        │            │
│ │ ██████              │ │   ╰────────╯        │            │
│ └─────────────────────┘ └─────────────────────┘            │
│                                                             │
│ Tool Statistics          Agent Statistics                   │
│ ┌────────────────────┐  ┌────────────────────┐             │
│ │ Tool │ Count │ ... │  │ Agent │ Count │... │             │
│ └────────────────────┘  └────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

## Development

The dashboard is a static site with no build process. Simply edit the files and refresh your browser.

### Files

- `index.html` - Main HTML structure
- `styles.css` - Dark theme styling
- `app.js` - Chart.js integration and data fetching

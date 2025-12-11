/**
 * Flynn Analytics Dashboard
 *
 * Fetches analytics data from the Flynn MCP server and displays it.
 * Uses Chart.js for visualizations.
 */

// Configuration
const CONFIG = {
  // API endpoint - adjust based on your setup
  apiBaseUrl: localStorage.getItem("flynn_api_url") || "http://localhost:3000/api",
  refreshInterval: 30000, // 30 seconds
  chartColors: {
    blue: "#58a6ff",
    green: "#3fb950",
    purple: "#a371f7",
    orange: "#d29922",
    red: "#f85149",
    cyan: "#39c5cf",
    pink: "#db61a2",
    yellow: "#e3b341",
  },
};

// Chart instances
let toolChart = null;
let agentChart = null;

// State
let autoRefreshTimer = null;
let isLoading = false;

/**
 * Initialize the dashboard
 */
async function init() {
  console.log("Flynn Analytics Dashboard initializing...");

  // Setup event listeners
  document.getElementById("refresh-btn").addEventListener("click", refreshData);

  // Initialize charts
  initCharts();

  // Load initial data
  await refreshData();

  // Start auto-refresh
  startAutoRefresh();

  // Check for demo mode
  checkDemoMode();
}

/**
 * Check if we should run in demo mode (no API available)
 */
function checkDemoMode() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("demo") === "true") {
    loadDemoData();
  }
}

/**
 * Initialize Chart.js charts
 */
function initCharts() {
  // Chart.js global defaults for dark theme
  Chart.defaults.color = "#8b949e";
  Chart.defaults.borderColor = "#30363d";

  const toolCtx = document.getElementById("tool-chart").getContext("2d");
  const agentCtx = document.getElementById("agent-chart").getContext("2d");

  // Tool Usage Bar Chart
  toolChart = new Chart(toolCtx, {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          label: "Usage Count",
          data: [],
          backgroundColor: CONFIG.chartColors.blue,
          borderColor: CONFIG.chartColors.blue,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "#21262d" },
        },
        x: {
          grid: { display: false },
        },
      },
    },
  });

  // Agent Usage Doughnut Chart
  agentChart = new Chart(agentCtx, {
    type: "doughnut",
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: Object.values(CONFIG.chartColors),
          borderColor: "#161b22",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            boxWidth: 12,
            padding: 10,
          },
        },
      },
    },
  });
}

/**
 * Refresh all data from the API
 */
async function refreshData() {
  if (isLoading) return;

  isLoading = true;
  updateStatus("loading");

  try {
    // Fetch all data in parallel
    const [summary, toolStats, agentStats, session] = await Promise.all([
      fetchAnalytics("get-summary"),
      fetchAnalytics("get-tool-stats", { limit: 10 }),
      fetchAnalytics("get-agent-stats", { limit: 10 }),
      fetchAnalytics("get-session"),
    ]);

    // Update UI
    updateSummaryCards(summary);
    updateToolChart(toolStats);
    updateAgentChart(agentStats);
    updateToolStatsTable(toolStats);
    updateAgentStatsTable(agentStats);
    updateSessionDetails(session);
    updateLastUpdated();

    updateStatus("connected");
  } catch (error) {
    console.error("Failed to fetch data:", error);
    updateStatus("error");

    // Try demo mode if API fails
    if (error.message.includes("Failed to fetch")) {
      console.log("API not available, loading demo data...");
      loadDemoData();
    }
  } finally {
    isLoading = false;
  }
}

/**
 * Fetch analytics data from the API
 */
async function fetchAnalytics(action, params = {}) {
  const url = new URL(`${CONFIG.apiBaseUrl}/analytics`);
  url.searchParams.set("action", action);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Load demo data for testing without API
 */
function loadDemoData() {
  const demoSummary = {
    success: true,
    summary: {
      totalSessions: 42,
      totalTokens: 1234567,
      totalCost: 18.45,
      avgTokensPerSession: 29394,
    },
  };

  const demoToolStats = {
    success: true,
    toolStats: [
      { toolName: "orchestrate", count: 156, avgDuration: 245, successRate: 0.98 },
      { toolName: "get-agent-context", count: 134, avgDuration: 12, successRate: 1.0 },
      { toolName: "route-task", count: 98, avgDuration: 8, successRate: 0.99 },
      { toolName: "shell", count: 87, avgDuration: 1240, successRate: 0.92 },
      { toolName: "file-ops", count: 76, avgDuration: 34, successRate: 0.97 },
      { toolName: "git-ops", count: 54, avgDuration: 156, successRate: 0.94 },
      { toolName: "health-check", count: 43, avgDuration: 89, successRate: 1.0 },
      { toolName: "get-skill", count: 32, avgDuration: 15, successRate: 1.0 },
      { toolName: "analytics", count: 28, avgDuration: 5, successRate: 1.0 },
      { toolName: "heal-error", count: 12, avgDuration: 320, successRate: 0.83 },
    ],
  };

  const demoAgentStats = {
    success: true,
    agentStats: [
      { agentId: "coder", count: 45, successRate: 0.96, avgTokens: 8500 },
      { agentId: "diagnostic", count: 38, successRate: 0.97, avgTokens: 4200 },
      { agentId: "scaffolder", count: 22, successRate: 0.95, avgTokens: 6800 },
      { agentId: "refactor", count: 18, successRate: 0.89, avgTokens: 12000 },
      { agentId: "reviewer", count: 15, successRate: 0.93, avgTokens: 5600 },
      { agentId: "security", count: 12, successRate: 1.0, avgTokens: 3400 },
    ],
  };

  const demoSession = {
    success: true,
    session: {
      sessionId: "flynn-demo-session",
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      totalTokens: 45678,
      inputTokens: 12345,
      outputTokens: 33333,
      messageCount: 23,
      toolCallCount: 67,
      agentsUsed: ["coder", "diagnostic", "scaffolder"],
      workflowsExecuted: ["fix-bug", "new-feature"],
      estimatedCost: 0.68,
    },
  };

  // Update UI with demo data
  updateSummaryCards(demoSummary);
  updateToolChart(demoToolStats);
  updateAgentChart(demoAgentStats);
  updateToolStatsTable(demoToolStats);
  updateAgentStatsTable(demoAgentStats);
  updateSessionDetails(demoSession);
  updateLastUpdated();

  updateStatus("demo");
}

/**
 * Update summary cards
 */
function updateSummaryCards(data) {
  if (!data.success || !data.summary) return;

  const { totalSessions, totalTokens, totalCost, avgTokensPerSession } = data.summary;

  document.getElementById("total-sessions").textContent = formatNumber(totalSessions);
  document.getElementById("total-tokens").textContent = formatNumber(totalTokens);
  document.getElementById("total-cost").textContent = `$${totalCost.toFixed(2)}`;
  document.getElementById("avg-tokens").textContent = formatNumber(avgTokensPerSession);
}

/**
 * Update tool usage chart
 */
function updateToolChart(data) {
  if (!data.success || !data.toolStats) return;

  const labels = data.toolStats.map((t) => t.toolName);
  const values = data.toolStats.map((t) => t.count);

  toolChart.data.labels = labels;
  toolChart.data.datasets[0].data = values;
  toolChart.update();
}

/**
 * Update agent usage chart
 */
function updateAgentChart(data) {
  if (!data.success || !data.agentStats) return;

  const labels = data.agentStats.map((a) => a.agentId);
  const values = data.agentStats.map((a) => a.count);

  agentChart.data.labels = labels;
  agentChart.data.datasets[0].data = values;
  agentChart.update();
}

/**
 * Update tool stats table
 */
function updateToolStatsTable(data) {
  const tbody = document.querySelector("#tool-stats-table tbody");

  if (!data.success || !data.toolStats || data.toolStats.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="no-data">No data available</td></tr>';
    return;
  }

  tbody.innerHTML = data.toolStats
    .map(
      (tool) => `
        <tr>
            <td><code>${escapeHtml(tool.toolName)}</code></td>
            <td>${formatNumber(tool.count)}</td>
            <td>${escapeHtml(tool.avgDuration)}ms</td>
            <td class="${getSuccessRateClass(tool.successRate)}">${(tool.successRate * 100).toFixed(0)}%</td>
        </tr>
    `,
    )
    .join("");
}

/**
 * Update agent stats table
 */
function updateAgentStatsTable(data) {
  const tbody = document.querySelector("#agent-stats-table tbody");

  if (!data.success || !data.agentStats || data.agentStats.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="no-data">No data available</td></tr>';
    return;
  }

  tbody.innerHTML = data.agentStats
    .map(
      (agent) => `
        <tr>
            <td><code>${escapeHtml(agent.agentId)}</code></td>
            <td>${formatNumber(agent.count)}</td>
            <td class="${getSuccessRateClass(agent.successRate)}">${(agent.successRate * 100).toFixed(0)}%</td>
            <td>${formatNumber(agent.avgTokens)}</td>
        </tr>
    `,
    )
    .join("");
}

/**
 * Update session details
 */
function updateSessionDetails(data) {
  const container = document.getElementById("session-details");

  if (!data.success || !data.session) {
    container.innerHTML = '<p class="no-session">No active session</p>';
    return;
  }

  const session = data.session;
  const duration = session.endedAt
    ? "Ended"
    : formatDuration(new Date() - new Date(session.startedAt));

  // Sanitize all user-controllable data to prevent XSS
  const safeSessionId = escapeHtml(session.sessionId);
  const safeDuration = escapeHtml(duration);
  const safeAgentsUsed = session.agentsUsed.map(escapeHtml).join(", ") || "None";
  const safeWorkflows = session.workflowsExecuted.map(escapeHtml).join(", ") || "None";

  container.innerHTML = `
        <div class="session-item">
            <div class="session-item-label">Session ID</div>
            <div class="session-item-value"><code>${safeSessionId}</code></div>
        </div>
        <div class="session-item">
            <div class="session-item-label">Duration</div>
            <div class="session-item-value">${safeDuration}</div>
        </div>
        <div class="session-item">
            <div class="session-item-label">Messages</div>
            <div class="session-item-value">${escapeHtml(session.messageCount)}</div>
        </div>
        <div class="session-item">
            <div class="session-item-label">Tool Calls</div>
            <div class="session-item-value">${escapeHtml(session.toolCallCount)}</div>
        </div>
        <div class="session-item">
            <div class="session-item-label">Tokens</div>
            <div class="session-item-value">${formatNumber(session.totalTokens)}</div>
        </div>
        <div class="session-item">
            <div class="session-item-label">Cost</div>
            <div class="session-item-value">$${session.estimatedCost.toFixed(4)}</div>
        </div>
        <div class="session-item">
            <div class="session-item-label">Agents Used</div>
            <div class="session-item-value">${safeAgentsUsed}</div>
        </div>
        <div class="session-item">
            <div class="session-item-label">Workflows</div>
            <div class="session-item-value">${safeWorkflows}</div>
        </div>
    `;
}

/**
 * Update connection status indicator
 */
function updateStatus(status) {
  const statusEl = document.getElementById("connection-status");

  const statusMap = {
    loading: { text: "Loading...", class: "" },
    connected: { text: "Connected", class: "connected" },
    error: { text: "Disconnected", class: "error" },
    demo: { text: "Demo Mode", class: "connected" },
  };

  const { text, class: className } = statusMap[status] || statusMap.error;
  statusEl.textContent = text;
  statusEl.className = `status ${className}`;
}

/**
 * Update last updated timestamp
 */
function updateLastUpdated() {
  document.getElementById("last-updated").textContent = new Date().toLocaleTimeString();
}

/**
 * Start auto-refresh timer
 */
function startAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
  }
  autoRefreshTimer = setInterval(refreshData, CONFIG.refreshInterval);
}

// Utility functions

/**
 * Escape HTML special characters to prevent XSS
 * Source: OWASP XSS Prevention Cheat Sheet
 * https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
 */
function escapeHtml(unsafe) {
  if (typeof unsafe !== "string") return String(unsafe);
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function getSuccessRateClass(rate) {
  if (rate >= 0.95) return "success-high";
  if (rate >= 0.8) return "success-medium";
  return "success-low";
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", init);

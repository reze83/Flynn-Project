/**
 * API Client
 *
 * Communicates with the Flynn MCP server for analytics data.
 */

// Analytics data types
export interface SummaryData {
  totalSessions: number;
  totalTokens: number;
  totalCost: number;
  avgTokensPerSession: number;
}

export interface ToolStat {
  toolName: string;
  count: number;
  avgDuration: number;
  successRate: number;
}

export interface AgentStat {
  agentId: string;
  count: number;
  successRate: number;
  avgTokens: number;
}

export interface SessionData {
  sessionId: string;
  startedAt: string;
  endedAt?: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  messageCount: number;
  toolCallCount: number;
  agentsUsed: string[];
  workflowsExecuted: string[];
  estimatedCost: number;
}

export interface HealthCheckResult {
  success: boolean;
  checks: {
    name: string;
    status: "pass" | "fail" | "warn";
    message: string;
  }[];
  summary: {
    passed: number;
    failed: number;
    warnings: number;
  };
}

// API configuration
const API_BASE_URL = process.env.FLYNN_API_URL || "http://localhost:3000/api";

/**
 * Fetch analytics data
 */
export async function fetchAnalytics<T>(
  action: string,
  params: Record<string, string | number> = {},
): Promise<T> {
  const url = new URL(`${API_BASE_URL}/analytics`);
  url.searchParams.set("action", action);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as T;
  return data;
}

/**
 * Get analytics summary
 */
export async function getSummary(): Promise<{
  success: boolean;
  summary: SummaryData;
}> {
  return fetchAnalytics("get-summary");
}

/**
 * Get tool statistics
 */
export async function getToolStats(
  limit = 10,
): Promise<{ success: boolean; toolStats: ToolStat[] }> {
  return fetchAnalytics("get-tool-stats", { limit });
}

/**
 * Get agent statistics
 */
export async function getAgentStats(
  limit = 10,
): Promise<{ success: boolean; agentStats: AgentStat[] }> {
  return fetchAnalytics("get-agent-stats", { limit });
}

/**
 * Get current session
 */
export async function getSession(): Promise<{
  success: boolean;
  session?: SessionData;
  error?: string;
}> {
  return fetchAnalytics("get-session");
}

/**
 * Run health check
 */
export async function runHealthCheck(): Promise<HealthCheckResult> {
  const url = new URL(`${API_BASE_URL}/health-check`);
  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return (await response.json()) as HealthCheckResult;
}

/**
 * Check if API is available
 */
export async function checkApiConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get demo data for offline mode
 */
export function getDemoSummary(): { success: boolean; summary: SummaryData } {
  return {
    success: true,
    summary: {
      totalSessions: 42,
      totalTokens: 1234567,
      totalCost: 18.45,
      avgTokensPerSession: 29394,
    },
  };
}

export function getDemoToolStats(): {
  success: boolean;
  toolStats: ToolStat[];
} {
  return {
    success: true,
    toolStats: [
      { toolName: "orchestrate", count: 156, avgDuration: 245, successRate: 0.98 },
      { toolName: "get-agent-context", count: 134, avgDuration: 12, successRate: 1.0 },
      { toolName: "route-task", count: 98, avgDuration: 8, successRate: 0.99 },
      { toolName: "shell", count: 87, avgDuration: 1240, successRate: 0.92 },
      { toolName: "file-ops", count: 76, avgDuration: 34, successRate: 0.97 },
    ],
  };
}

export function getDemoAgentStats(): {
  success: boolean;
  agentStats: AgentStat[];
} {
  return {
    success: true,
    agentStats: [
      { agentId: "coder", count: 45, successRate: 0.96, avgTokens: 8500 },
      { agentId: "diagnostic", count: 38, successRate: 0.97, avgTokens: 4200 },
      { agentId: "scaffolder", count: 22, successRate: 0.95, avgTokens: 6800 },
      { agentId: "refactor", count: 18, successRate: 0.89, avgTokens: 12000 },
      { agentId: "reviewer", count: 15, successRate: 0.93, avgTokens: 5600 },
    ],
  };
}

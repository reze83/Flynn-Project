/**
 * Simple in-memory metrics for tool executions.
 */

type Outcome = "success" | "fail" | "blocked";

interface ToolMetrics {
  success: number;
  fail: number;
  blocked: number;
  count: number;
  totalDurationMs: number;
}

const metricsStore = new Map<string, ToolMetrics>();

function getOrCreate(tool: string): ToolMetrics {
  if (!metricsStore.has(tool)) {
    metricsStore.set(tool, {
      success: 0,
      fail: 0,
      blocked: 0,
      count: 0,
      totalDurationMs: 0,
    });
  }
  // biome-ignore lint/style/noNonNullAssertion: we just set the key above if missing
  return metricsStore.get(tool)!;
}

export function recordToolMetric(params: {
  tool: string;
  outcome: Outcome;
  durationMs?: number;
}): void {
  const { tool, outcome, durationMs = 0 } = params;
  const entry = getOrCreate(tool);
  entry.count += 1;
  entry.totalDurationMs += durationMs;
  if (outcome === "success") entry.success += 1;
  if (outcome === "fail") entry.fail += 1;
  if (outcome === "blocked") entry.blocked += 1;
}

export function getMetrics(): Record<string, ToolMetrics> {
  return Object.fromEntries(metricsStore.entries());
}

export function resetMetrics(): void {
  metricsStore.clear();
}

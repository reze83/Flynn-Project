/**
 * Flynn Analytics Collector
 *
 * Collects and processes usage metrics for Flynn sessions.
 */

import { AnalyticsStorage } from "./storage.js";
import {
  type AgentUsage,
  DEFAULT_PRICING,
  type SessionMetrics,
  type ToolUsage,
  type WorkflowExecution,
} from "./types.js";

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `flynn-${timestamp}-${random}`;
}

/**
 * Estimate cost based on token usage
 */
function estimateCost(
  inputTokens: number,
  outputTokens: number,
  model: "haiku" | "sonnet" | "opus" = "sonnet",
): number {
  const pricing = DEFAULT_PRICING[model];
  if (!pricing) {
    // Fallback to sonnet pricing
    return (inputTokens / 1_000_000) * 3.0 + (outputTokens / 1_000_000) * 15.0;
  }
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPricePerMillion;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPricePerMillion;
  return inputCost + outputCost;
}

/**
 * Analytics Collector for tracking Flynn usage
 */
export class AnalyticsCollector {
  private storage: AnalyticsStorage;
  private currentSession: SessionMetrics | null = null;
  private sessionStartTime: Date | null = null;

  constructor(dbPath?: string) {
    this.storage = new AnalyticsStorage(dbPath);
  }

  /**
   * Start a new session
   */
  async startSession(sessionId?: string): Promise<string> {
    const id = sessionId || generateSessionId();
    this.sessionStartTime = new Date();

    this.currentSession = {
      sessionId: id,
      startedAt: this.sessionStartTime,
      totalTokens: 0,
      inputTokens: 0,
      outputTokens: 0,
      messageCount: 0,
      toolCallCount: 0,
      agentsUsed: [],
      workflowsExecuted: [],
      estimatedCost: 0,
    };

    await this.storage.upsertSession(this.currentSession);
    return id;
  }

  /**
   * End the current session
   */
  async endSession(): Promise<SessionMetrics | null> {
    if (!this.currentSession) return null;

    this.currentSession.endedAt = new Date();
    await this.storage.upsertSession(this.currentSession);

    const session = this.currentSession;
    this.currentSession = null;
    this.sessionStartTime = null;

    return session;
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSession?.sessionId ?? null;
  }

  /**
   * Record a message exchange
   */
  async recordMessage(
    inputTokens: number,
    outputTokens: number,
    model: "haiku" | "sonnet" | "opus" = "sonnet",
  ): Promise<void> {
    if (!this.currentSession) {
      await this.startSession();
    }

    const session = this.currentSession;
    if (!session) return;

    session.inputTokens += inputTokens;
    session.outputTokens += outputTokens;
    session.totalTokens += inputTokens + outputTokens;
    session.messageCount += 1;
    session.estimatedCost += estimateCost(inputTokens, outputTokens, model);

    await this.storage.upsertSession(session);
  }

  /**
   * Record tool usage
   */
  async recordToolUsage(
    toolName: string,
    durationMs: number,
    success: boolean,
    error?: string,
    inputTokens?: number,
    outputTokens?: number,
  ): Promise<void> {
    if (!this.currentSession) {
      await this.startSession();
    }

    const session = this.currentSession;
    if (!session) return;

    const usage: ToolUsage = {
      toolName,
      sessionId: session.sessionId,
      timestamp: new Date(),
      durationMs,
      success,
      error,
      inputTokens,
      outputTokens,
    };

    await this.storage.recordToolUsage(usage);

    session.toolCallCount += 1;
    if (inputTokens) session.inputTokens += inputTokens;
    if (outputTokens) session.outputTokens += outputTokens;

    await this.storage.upsertSession(session);
  }

  /**
   * Record agent usage
   */
  async recordAgentUsage(
    agentId: string,
    task: string,
    success: boolean,
    modelUsed?: "haiku" | "sonnet" | "opus",
    tokenCount?: number,
  ): Promise<void> {
    if (!this.currentSession) {
      await this.startSession();
    }

    const session = this.currentSession;
    if (!session) return;

    const usage: AgentUsage = {
      agentId,
      sessionId: session.sessionId,
      timestamp: new Date(),
      task,
      success,
      modelUsed,
      tokenCount,
    };

    await this.storage.recordAgentUsage(usage);

    if (!session.agentsUsed.includes(agentId)) {
      session.agentsUsed.push(agentId);
    }

    if (tokenCount) {
      session.totalTokens += tokenCount;
      if (modelUsed) {
        session.estimatedCost += estimateCost(
          tokenCount * 0.3, // rough estimate: 30% input
          tokenCount * 0.7, // rough estimate: 70% output
          modelUsed,
        );
      }
    }

    await this.storage.upsertSession(session);
  }

  /**
   * Record workflow execution
   */
  async recordWorkflowExecution(
    workflowId: string,
    agents: string[],
    stepsCompleted: number,
    totalSteps: number,
    success: boolean,
    durationMs: number,
  ): Promise<void> {
    if (!this.currentSession) {
      await this.startSession();
    }

    const session = this.currentSession;
    if (!session) return;

    const execution: WorkflowExecution = {
      workflowId,
      sessionId: session.sessionId,
      timestamp: new Date(),
      agents,
      stepsCompleted,
      totalSteps,
      success,
      durationMs,
    };

    await this.storage.recordWorkflowExecution(execution);

    if (!session.workflowsExecuted.includes(workflowId)) {
      session.workflowsExecuted.push(workflowId);
    }

    await this.storage.upsertSession(session);
  }

  /**
   * Get session metrics
   */
  async getSessionMetrics(sessionId: string): Promise<SessionMetrics | null> {
    return this.storage.getSession(sessionId);
  }

  /**
   * Get current session metrics
   */
  getCurrentMetrics(): SessionMetrics | null {
    return this.currentSession;
  }

  /**
   * Get tool statistics
   */
  async getToolStats(options?: {
    sessionId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    return this.storage.getToolStats(options);
  }

  /**
   * Get agent statistics
   */
  async getAgentStats(options?: {
    sessionId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    return this.storage.getAgentStats(options);
  }

  /**
   * Get aggregated metrics for a time period
   */
  async getAggregatedMetrics(startDate: Date, endDate: Date) {
    return this.storage.getAggregatedMetrics(startDate, endDate);
  }

  /**
   * Get daily summary for the last N days
   */
  async getDailySummary(days = 7) {
    const summaries = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() - i);
      endDate.setHours(23, 59, 59, 999);

      const startDate = new Date(endDate);
      startDate.setHours(0, 0, 0, 0);

      const metrics = await this.storage.getAggregatedMetrics(startDate, endDate);
      summaries.push({
        date: startDate.toISOString().split("T")[0],
        ...metrics,
      });
    }

    return summaries.reverse();
  }

  /**
   * Close the collector
   */
  async close(): Promise<void> {
    if (this.currentSession) {
      await this.endSession();
    }
    await this.storage.close();
  }
}

/**
 * Singleton instance for global analytics
 */
let globalCollector: AnalyticsCollector | null = null;

/**
 * Get or create the global analytics collector
 */
export function getAnalyticsCollector(dbPath?: string): AnalyticsCollector {
  if (!globalCollector) {
    globalCollector = new AnalyticsCollector(dbPath);
  }
  return globalCollector;
}

/**
 * Reset the global collector (for testing)
 */
export async function resetAnalyticsCollector(): Promise<void> {
  if (globalCollector) {
    await globalCollector.close();
    globalCollector = null;
  }
}

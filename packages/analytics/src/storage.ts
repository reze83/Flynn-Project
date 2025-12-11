/**
 * Flynn Analytics Storage
 *
 * LibSQL-based storage for analytics data.
 * Uses the same pattern as the RAG system.
 */

import { type Client, createClient } from "@libsql/client";
import type {
  AgentUsage,
  AggregatedMetrics,
  QueryOptions,
  SessionMetrics,
  ToolUsage,
  WorkflowExecution,
} from "./types.js";

export class AnalyticsStorage {
  private client: Client;
  private initialized = false;

  constructor(dbPath = "file:flynn-analytics.db") {
    this.client = createClient({
      url: dbPath,
    });
  }

  /**
   * Initialize database schema
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Sessions table
    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        total_tokens INTEGER DEFAULT 0,
        input_tokens INTEGER DEFAULT 0,
        output_tokens INTEGER DEFAULT 0,
        message_count INTEGER DEFAULT 0,
        tool_call_count INTEGER DEFAULT 0,
        agents_used TEXT DEFAULT '[]',
        workflows_executed TEXT DEFAULT '[]',
        estimated_cost REAL DEFAULT 0
      )
    `);

    // Tool usage table
    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS tool_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tool_name TEXT NOT NULL,
        session_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        duration_ms INTEGER DEFAULT 0,
        success INTEGER DEFAULT 1,
        error TEXT,
        input_tokens INTEGER,
        output_tokens INTEGER,
        FOREIGN KEY (session_id) REFERENCES sessions(session_id)
      )
    `);

    // Agent usage table
    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS agent_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        task TEXT,
        success INTEGER DEFAULT 1,
        model_used TEXT,
        token_count INTEGER,
        FOREIGN KEY (session_id) REFERENCES sessions(session_id)
      )
    `);

    // Workflow execution table
    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS workflow_execution (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workflow_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        agents TEXT NOT NULL,
        steps_completed INTEGER DEFAULT 0,
        total_steps INTEGER DEFAULT 0,
        success INTEGER DEFAULT 1,
        duration_ms INTEGER DEFAULT 0,
        FOREIGN KEY (session_id) REFERENCES sessions(session_id)
      )
    `);

    // Create indexes
    await this.client.execute(
      "CREATE INDEX IF NOT EXISTS idx_tool_usage_session ON tool_usage(session_id)",
    );
    await this.client.execute(
      "CREATE INDEX IF NOT EXISTS idx_tool_usage_name ON tool_usage(tool_name)",
    );
    await this.client.execute(
      "CREATE INDEX IF NOT EXISTS idx_agent_usage_session ON agent_usage(session_id)",
    );
    await this.client.execute(
      "CREATE INDEX IF NOT EXISTS idx_agent_usage_agent ON agent_usage(agent_id)",
    );
    await this.client.execute(
      "CREATE INDEX IF NOT EXISTS idx_workflow_session ON workflow_execution(session_id)",
    );

    this.initialized = true;
  }

  /**
   * Create or update a session
   */
  async upsertSession(session: SessionMetrics): Promise<void> {
    await this.initialize();

    await this.client.execute({
      sql: `
        INSERT INTO sessions (
          session_id, started_at, ended_at, total_tokens, input_tokens,
          output_tokens, message_count, tool_call_count, agents_used,
          workflows_executed, estimated_cost
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(session_id) DO UPDATE SET
          ended_at = excluded.ended_at,
          total_tokens = excluded.total_tokens,
          input_tokens = excluded.input_tokens,
          output_tokens = excluded.output_tokens,
          message_count = excluded.message_count,
          tool_call_count = excluded.tool_call_count,
          agents_used = excluded.agents_used,
          workflows_executed = excluded.workflows_executed,
          estimated_cost = excluded.estimated_cost
      `,
      args: [
        session.sessionId,
        session.startedAt.toISOString(),
        session.endedAt?.toISOString() ?? null,
        session.totalTokens,
        session.inputTokens,
        session.outputTokens,
        session.messageCount,
        session.toolCallCount,
        JSON.stringify(session.agentsUsed),
        JSON.stringify(session.workflowsExecuted),
        session.estimatedCost,
      ],
    });
  }

  /**
   * Record tool usage
   */
  async recordToolUsage(usage: ToolUsage): Promise<void> {
    await this.initialize();

    await this.client.execute({
      sql: `
        INSERT INTO tool_usage (
          tool_name, session_id, timestamp, duration_ms, success,
          error, input_tokens, output_tokens
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        usage.toolName,
        usage.sessionId,
        usage.timestamp.toISOString(),
        usage.durationMs,
        usage.success ? 1 : 0,
        usage.error ?? null,
        usage.inputTokens ?? null,
        usage.outputTokens ?? null,
      ],
    });
  }

  /**
   * Record agent usage
   */
  async recordAgentUsage(usage: AgentUsage): Promise<void> {
    await this.initialize();

    await this.client.execute({
      sql: `
        INSERT INTO agent_usage (
          agent_id, session_id, timestamp, task, success, model_used, token_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        usage.agentId,
        usage.sessionId,
        usage.timestamp.toISOString(),
        usage.task,
        usage.success ? 1 : 0,
        usage.modelUsed ?? null,
        usage.tokenCount ?? null,
      ],
    });
  }

  /**
   * Record workflow execution
   */
  async recordWorkflowExecution(execution: WorkflowExecution): Promise<void> {
    await this.initialize();

    await this.client.execute({
      sql: `
        INSERT INTO workflow_execution (
          workflow_id, session_id, timestamp, agents, steps_completed,
          total_steps, success, duration_ms
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        execution.workflowId,
        execution.sessionId,
        execution.timestamp.toISOString(),
        JSON.stringify(execution.agents),
        execution.stepsCompleted,
        execution.totalSteps,
        execution.success ? 1 : 0,
        execution.durationMs,
      ],
    });
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<SessionMetrics | null> {
    await this.initialize();

    const result = await this.client.execute({
      sql: "SELECT * FROM sessions WHERE session_id = ?",
      args: [sessionId],
    });

    const row = result.rows[0];
    if (!row) return null;

    return {
      sessionId: row.session_id as string,
      startedAt: new Date(row.started_at as string),
      endedAt: row.ended_at ? new Date(row.ended_at as string) : undefined,
      totalTokens: row.total_tokens as number,
      inputTokens: row.input_tokens as number,
      outputTokens: row.output_tokens as number,
      messageCount: row.message_count as number,
      toolCallCount: row.tool_call_count as number,
      agentsUsed: JSON.parse(row.agents_used as string),
      workflowsExecuted: JSON.parse(row.workflows_executed as string),
      estimatedCost: row.estimated_cost as number,
    };
  }

  /**
   * Get tool usage statistics
   */
  async getToolStats(
    options: QueryOptions = {},
  ): Promise<Array<{ toolName: string; count: number; avgDuration: number; successRate: number }>> {
    await this.initialize();

    let sql = `
      SELECT
        tool_name,
        COUNT(*) as count,
        AVG(duration_ms) as avg_duration,
        AVG(CAST(success AS REAL)) as success_rate
      FROM tool_usage
      WHERE 1=1
    `;
    const args: (string | number)[] = [];

    if (options.sessionId) {
      sql += " AND session_id = ?";
      args.push(options.sessionId);
    }
    if (options.startDate) {
      sql += " AND timestamp >= ?";
      args.push(options.startDate.toISOString());
    }
    if (options.endDate) {
      sql += " AND timestamp <= ?";
      args.push(options.endDate.toISOString());
    }

    sql += " GROUP BY tool_name ORDER BY count DESC";

    if (options.limit) {
      sql += " LIMIT ?";
      args.push(options.limit);
    }

    const result = await this.client.execute({ sql, args });

    return result.rows.map((row) => ({
      toolName: row.tool_name as string,
      count: row.count as number,
      avgDuration: row.avg_duration as number,
      successRate: row.success_rate as number,
    }));
  }

  /**
   * Get agent usage statistics
   */
  async getAgentStats(
    options: QueryOptions = {},
  ): Promise<Array<{ agentId: string; count: number; successRate: number; avgTokens: number }>> {
    await this.initialize();

    let sql = `
      SELECT
        agent_id,
        COUNT(*) as count,
        AVG(CAST(success AS REAL)) as success_rate,
        AVG(COALESCE(token_count, 0)) as avg_tokens
      FROM agent_usage
      WHERE 1=1
    `;
    const args: (string | number)[] = [];

    if (options.sessionId) {
      sql += " AND session_id = ?";
      args.push(options.sessionId);
    }
    if (options.startDate) {
      sql += " AND timestamp >= ?";
      args.push(options.startDate.toISOString());
    }
    if (options.endDate) {
      sql += " AND timestamp <= ?";
      args.push(options.endDate.toISOString());
    }

    sql += " GROUP BY agent_id ORDER BY count DESC";

    if (options.limit) {
      sql += " LIMIT ?";
      args.push(options.limit);
    }

    const result = await this.client.execute({ sql, args });

    return result.rows.map((row) => ({
      agentId: row.agent_id as string,
      count: row.count as number,
      successRate: row.success_rate as number,
      avgTokens: row.avg_tokens as number,
    }));
  }

  /**
   * Get aggregated metrics for a time period
   */
  async getAggregatedMetrics(startDate: Date, endDate: Date): Promise<AggregatedMetrics> {
    await this.initialize();

    // Session stats
    const sessionResult = await this.client.execute({
      sql: `
        SELECT
          COUNT(*) as total_sessions,
          SUM(total_tokens) as total_tokens,
          SUM(estimated_cost) as total_cost,
          AVG(CASE WHEN ended_at IS NOT NULL
            THEN (julianday(ended_at) - julianday(started_at)) * 86400000
            ELSE 0 END) as avg_duration,
          AVG(total_tokens) as avg_tokens
        FROM sessions
        WHERE started_at >= ? AND started_at <= ?
      `,
      args: [startDate.toISOString(), endDate.toISOString()],
    });

    const sessionStats = sessionResult.rows[0] ?? {
      total_sessions: 0,
      total_tokens: 0,
      total_cost: 0,
      avg_duration: 0,
      avg_tokens: 0,
    };

    // Top agents
    const topAgents = await this.getAgentStats({
      startDate,
      endDate,
      limit: 10,
    });

    // Top tools
    const topTools = await this.getToolStats({
      startDate,
      endDate,
      limit: 10,
    });

    // Top workflows
    const workflowResult = await this.client.execute({
      sql: `
        SELECT workflow_id, COUNT(*) as count
        FROM workflow_execution
        WHERE timestamp >= ? AND timestamp <= ?
        GROUP BY workflow_id
        ORDER BY count DESC
        LIMIT 10
      `,
      args: [startDate.toISOString(), endDate.toISOString()],
    });

    return {
      periodStart: startDate,
      periodEnd: endDate,
      totalSessions: (sessionStats.total_sessions as number) || 0,
      totalTokens: (sessionStats.total_tokens as number) || 0,
      totalCost: (sessionStats.total_cost as number) || 0,
      topAgents: topAgents.map((a) => ({ agentId: a.agentId, count: a.count })),
      topTools: topTools.map((t) => ({ toolName: t.toolName, count: t.count })),
      topWorkflows: workflowResult.rows.map((row) => ({
        workflowId: row.workflow_id as string,
        count: row.count as number,
      })),
      avgSessionDuration: (sessionStats.avg_duration as number) || 0,
      avgTokensPerSession: (sessionStats.avg_tokens as number) || 0,
    };
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    this.client.close();
  }
}

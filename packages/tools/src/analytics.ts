/**
 * Analytics Tool
 *
 * MCP tool for querying Flynn usage analytics.
 * Provides insights into session metrics, tool usage, and agent performance.
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Analytics storage (in-memory for now, can be upgraded to persistent storage)
interface SessionData {
  sessionId: string;
  startedAt: Date;
  endedAt?: Date;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  messageCount: number;
  toolCallCount: number;
  agentsUsed: string[];
  workflowsExecuted: string[];
  estimatedCost: number;
}

interface ToolUsageData {
  toolName: string;
  count: number;
  totalDuration: number;
  successCount: number;
}

interface AgentUsageData {
  agentId: string;
  count: number;
  successCount: number;
  totalTokens: number;
}

// In-memory storage (singleton pattern)
const analyticsStore = {
  sessions: new Map<string, SessionData>(),
  toolUsage: new Map<string, ToolUsageData>(),
  agentUsage: new Map<string, AgentUsageData>(),
  currentSessionId: null as string | null,
};

// Token pricing (Dec 2024)
const PRICING = {
  haiku: { input: 0.25, output: 1.25 },
  sonnet: { input: 3.0, output: 15.0 },
  opus: { input: 15.0, output: 75.0 },
};

function estimateCost(
  inputTokens: number,
  outputTokens: number,
  model: "haiku" | "sonnet" | "opus" = "sonnet",
): number {
  const pricing = PRICING[model];
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
}

function generateSessionId(): string {
  return `flynn-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
}

const inputSchema = z.object({
  action: z
    .enum([
      "start-session",
      "end-session",
      "record-message",
      "record-tool",
      "record-agent",
      "record-workflow",
      "get-session",
      "get-summary",
      "get-tool-stats",
      "get-agent-stats",
      "reset",
    ])
    .describe("Analytics action to perform"),

  // Session actions
  sessionId: z.string().optional().describe("Session ID (auto-generated if not provided)"),

  // Record message
  inputTokens: z.number().optional().describe("Input token count"),
  outputTokens: z.number().optional().describe("Output token count"),
  model: z.enum(["haiku", "sonnet", "opus"]).optional().default("sonnet"),

  // Record tool
  toolName: z.string().optional().describe("Tool name for recording"),
  durationMs: z.number().optional().describe("Tool execution duration in ms"),
  success: z.boolean().optional().default(true),

  // Record agent
  agentId: z.string().optional().describe("Agent ID"),
  task: z.string().optional().describe("Task description"),
  tokenCount: z.number().optional().describe("Token count for agent"),

  // Record workflow
  workflowId: z.string().optional().describe("Workflow ID"),
  agents: z.array(z.string()).optional().describe("Agents in workflow"),
  stepsCompleted: z.number().optional(),
  totalSteps: z.number().optional(),

  // Query options
  days: z.number().optional().default(7).describe("Number of days for summary"),
  limit: z.number().optional().default(10).describe("Limit for stats"),
});

const outputSchema = z.object({
  success: z.boolean(),
  action: z.string(),
  sessionId: z.string().optional(),
  session: z
    .object({
      sessionId: z.string(),
      startedAt: z.string(),
      endedAt: z.string().optional(),
      totalTokens: z.number(),
      inputTokens: z.number(),
      outputTokens: z.number(),
      messageCount: z.number(),
      toolCallCount: z.number(),
      agentsUsed: z.array(z.string()),
      workflowsExecuted: z.array(z.string()),
      estimatedCost: z.number(),
    })
    .optional(),
  summary: z
    .object({
      totalSessions: z.number(),
      totalTokens: z.number(),
      totalCost: z.number(),
      avgTokensPerSession: z.number(),
    })
    .optional(),
  toolStats: z
    .array(
      z.object({
        toolName: z.string(),
        count: z.number(),
        avgDuration: z.number(),
        successRate: z.number(),
      }),
    )
    .optional(),
  agentStats: z
    .array(
      z.object({
        agentId: z.string(),
        count: z.number(),
        successRate: z.number(),
        avgTokens: z.number(),
      }),
    )
    .optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export const analyticsTool = createTool({
  id: "analytics",
  description: `Track and query Flynn usage analytics. Actions:
- start-session: Start tracking a new session
- end-session: End current session
- record-message: Record token usage for a message
- record-tool: Record tool usage
- record-agent: Record agent activation
- record-workflow: Record workflow execution
- get-session: Get session metrics
- get-summary: Get usage summary
- get-tool-stats: Get tool usage statistics
- get-agent-stats: Get agent usage statistics
- reset: Reset all analytics data`,
  inputSchema,
  outputSchema,
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: central handler for multiple analytics actions
  execute: async (input) => {
    const data = input as unknown as {
      context?: Partial<z.infer<typeof inputSchema>>;
    } & Partial<z.infer<typeof inputSchema>>;

    const action = data?.context?.action || data?.action;
    const sessionId = data?.context?.sessionId || data?.sessionId;
    const inputTokens = data?.context?.inputTokens || data?.inputTokens || 0;
    const outputTokens = data?.context?.outputTokens || data?.outputTokens || 0;
    const model = data?.context?.model || data?.model || "sonnet";
    const toolName = data?.context?.toolName || data?.toolName;
    const durationMs = data?.context?.durationMs || data?.durationMs || 0;
    const success = data?.context?.success ?? data?.success ?? true;
    const agentId = data?.context?.agentId || data?.agentId;
    // _task is reserved for future use (agent task recording)
    // _agents is reserved for future use (workflow agent list)
    const tokenCount = data?.context?.tokenCount || data?.tokenCount || 0;
    const workflowId = data?.context?.workflowId || data?.workflowId;
    const stepsCompleted = data?.context?.stepsCompleted || data?.stepsCompleted || 0;
    const totalSteps = data?.context?.totalSteps || data?.totalSteps || 0;
    const limit = data?.context?.limit || data?.limit || 10;

    switch (action) {
      case "start-session": {
        const id = sessionId || generateSessionId();
        const session: SessionData = {
          sessionId: id,
          startedAt: new Date(),
          totalTokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          messageCount: 0,
          toolCallCount: 0,
          agentsUsed: [],
          workflowsExecuted: [],
          estimatedCost: 0,
        };
        analyticsStore.sessions.set(id, session);
        analyticsStore.currentSessionId = id;
        return {
          success: true,
          action: "start-session",
          sessionId: id,
          message: `Session ${id} started`,
        };
      }

      case "end-session": {
        const id = sessionId || analyticsStore.currentSessionId;
        if (!id || !analyticsStore.sessions.has(id)) {
          return {
            success: false,
            action: "end-session",
            error: "No active session to end",
          };
        }
        const session = analyticsStore.sessions.get(id);
        if (!session) {
          return {
            success: false,
            action: "end-session",
            error: "Session data missing",
          };
        }
        session.endedAt = new Date();
        analyticsStore.currentSessionId = null;
        return {
          success: true,
          action: "end-session",
          sessionId: id,
          session: {
            ...session,
            startedAt: session.startedAt.toISOString(),
            endedAt: session.endedAt?.toISOString(),
          },
        };
      }

      case "record-message": {
        let id = sessionId || analyticsStore.currentSessionId;
        if (!id) {
          // Auto-start session
          id = generateSessionId();
          analyticsStore.sessions.set(id, {
            sessionId: id,
            startedAt: new Date(),
            totalTokens: 0,
            inputTokens: 0,
            outputTokens: 0,
            messageCount: 0,
            toolCallCount: 0,
            agentsUsed: [],
            workflowsExecuted: [],
            estimatedCost: 0,
          });
          analyticsStore.currentSessionId = id;
        }
        const session = analyticsStore.sessions.get(id);
        if (!session) {
          return {
            success: false,
            action: "record-message",
            error: "Session data missing",
          };
        }
        session.inputTokens += inputTokens;
        session.outputTokens += outputTokens;
        session.totalTokens += inputTokens + outputTokens;
        session.messageCount += 1;
        session.estimatedCost += estimateCost(inputTokens, outputTokens, model);
        return {
          success: true,
          action: "record-message",
          sessionId: id,
          message: `Recorded ${inputTokens + outputTokens} tokens`,
        };
      }

      case "record-tool": {
        if (!toolName) {
          return {
            success: false,
            action: "record-tool",
            error: "toolName is required",
          };
        }
        const existing = analyticsStore.toolUsage.get(toolName) || {
          toolName,
          count: 0,
          totalDuration: 0,
          successCount: 0,
        };
        existing.count += 1;
        existing.totalDuration += durationMs;
        if (success) existing.successCount += 1;
        analyticsStore.toolUsage.set(toolName, existing);

        // Update session
        const id = sessionId || analyticsStore.currentSessionId;
        if (id && analyticsStore.sessions.has(id)) {
          const session = analyticsStore.sessions.get(id);
          if (session) {
            session.toolCallCount += 1;
          }
        }

        return {
          success: true,
          action: "record-tool",
          message: `Recorded ${toolName} usage`,
        };
      }

      case "record-agent": {
        if (!agentId) {
          return {
            success: false,
            action: "record-agent",
            error: "agentId is required",
          };
        }
        const existing = analyticsStore.agentUsage.get(agentId) || {
          agentId,
          count: 0,
          successCount: 0,
          totalTokens: 0,
        };
        existing.count += 1;
        if (success) existing.successCount += 1;
        existing.totalTokens += tokenCount;
        analyticsStore.agentUsage.set(agentId, existing);

        // Update session
        const id = sessionId || analyticsStore.currentSessionId;
        if (id && analyticsStore.sessions.has(id)) {
          const session = analyticsStore.sessions.get(id);
          if (session && !session.agentsUsed.includes(agentId)) {
            session.agentsUsed.push(agentId);
          }
        }

        return {
          success: true,
          action: "record-agent",
          message: `Recorded ${agentId} usage`,
        };
      }

      case "record-workflow": {
        if (!workflowId) {
          return {
            success: false,
            action: "record-workflow",
            error: "workflowId is required",
          };
        }
        const id = sessionId || analyticsStore.currentSessionId;
        if (id && analyticsStore.sessions.has(id)) {
          const session = analyticsStore.sessions.get(id);
          if (session && !session.workflowsExecuted.includes(workflowId)) {
            session.workflowsExecuted.push(workflowId);
          }
        }
        return {
          success: true,
          action: "record-workflow",
          message: `Recorded ${workflowId} workflow (${stepsCompleted}/${totalSteps} steps)`,
        };
      }

      case "get-session": {
        const id = sessionId || analyticsStore.currentSessionId;
        if (!id || !analyticsStore.sessions.has(id)) {
          return {
            success: false,
            action: "get-session",
            error: "Session not found",
          };
        }
        const session = analyticsStore.sessions.get(id);
        if (!session) {
          return {
            success: false,
            action: "get-session",
            error: "Session data missing",
          };
        }
        return {
          success: true,
          action: "get-session",
          sessionId: id,
          session: {
            ...session,
            startedAt: session.startedAt.toISOString(),
            endedAt: session.endedAt?.toISOString(),
          },
        };
      }

      case "get-summary": {
        const sessions = Array.from(analyticsStore.sessions.values());
        const totalSessions = sessions.length;
        const totalTokens = sessions.reduce((sum, s) => sum + s.totalTokens, 0);
        const totalCost = sessions.reduce((sum, s) => sum + s.estimatedCost, 0);
        return {
          success: true,
          action: "get-summary",
          summary: {
            totalSessions,
            totalTokens,
            totalCost: Math.round(totalCost * 10000) / 10000,
            avgTokensPerSession: totalSessions > 0 ? Math.round(totalTokens / totalSessions) : 0,
          },
        };
      }

      case "get-tool-stats": {
        const stats = Array.from(analyticsStore.toolUsage.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, limit)
          .map((t) => ({
            toolName: t.toolName,
            count: t.count,
            avgDuration: t.count > 0 ? Math.round(t.totalDuration / t.count) : 0,
            successRate: t.count > 0 ? Math.round((t.successCount / t.count) * 100) / 100 : 0,
          }));
        return {
          success: true,
          action: "get-tool-stats",
          toolStats: stats,
        };
      }

      case "get-agent-stats": {
        const stats = Array.from(analyticsStore.agentUsage.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, limit)
          .map((a) => ({
            agentId: a.agentId,
            count: a.count,
            successRate: a.count > 0 ? Math.round((a.successCount / a.count) * 100) / 100 : 0,
            avgTokens: a.count > 0 ? Math.round(a.totalTokens / a.count) : 0,
          }));
        return {
          success: true,
          action: "get-agent-stats",
          agentStats: stats,
        };
      }

      case "reset": {
        analyticsStore.sessions.clear();
        analyticsStore.toolUsage.clear();
        analyticsStore.agentUsage.clear();
        analyticsStore.currentSessionId = null;
        return {
          success: true,
          action: "reset",
          message: "Analytics data reset",
        };
      }

      default:
        return {
          success: false,
          action: action || "unknown",
          error: `Unknown action: ${action}`,
        };
    }
  },
});

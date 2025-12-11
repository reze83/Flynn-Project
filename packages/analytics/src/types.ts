/**
 * Flynn Analytics Types
 *
 * Type definitions for usage tracking and metrics collection.
 */

/**
 * Session metrics for a Claude Code session
 */
export interface SessionMetrics {
  /** Unique session identifier */
  sessionId: string;
  /** Session start timestamp */
  startedAt: Date;
  /** Session end timestamp (if ended) */
  endedAt?: Date;
  /** Total tokens used in this session */
  totalTokens: number;
  /** Input tokens (prompts) */
  inputTokens: number;
  /** Output tokens (responses) */
  outputTokens: number;
  /** Number of messages exchanged */
  messageCount: number;
  /** Number of tool calls made */
  toolCallCount: number;
  /** Agents used in this session */
  agentsUsed: string[];
  /** Workflows executed */
  workflowsExecuted: string[];
  /** Estimated cost in USD */
  estimatedCost: number;
}

/**
 * Individual tool usage record
 */
export interface ToolUsage {
  /** Tool name */
  toolName: string;
  /** Session ID */
  sessionId: string;
  /** Timestamp of usage */
  timestamp: Date;
  /** Duration in milliseconds */
  durationMs: number;
  /** Whether the call succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Input token estimate for this call */
  inputTokens?: number;
  /** Output token estimate for this call */
  outputTokens?: number;
}

/**
 * Agent usage record
 */
export interface AgentUsage {
  /** Agent ID */
  agentId: string;
  /** Session ID */
  sessionId: string;
  /** Timestamp of activation */
  timestamp: Date;
  /** Task description */
  task: string;
  /** Whether the agent completed successfully */
  success: boolean;
  /** Model used (haiku/sonnet/opus) */
  modelUsed?: string;
  /** Token count for this agent activation */
  tokenCount?: number;
}

/**
 * Workflow execution record
 */
export interface WorkflowExecution {
  /** Workflow ID */
  workflowId: string;
  /** Session ID */
  sessionId: string;
  /** Timestamp of execution */
  timestamp: Date;
  /** Agents in the workflow */
  agents: string[];
  /** Total steps executed */
  stepsCompleted: number;
  /** Total steps in workflow */
  totalSteps: number;
  /** Whether workflow completed */
  success: boolean;
  /** Duration in milliseconds */
  durationMs: number;
}

/**
 * Aggregated metrics for a time period
 */
export interface AggregatedMetrics {
  /** Time period start */
  periodStart: Date;
  /** Time period end */
  periodEnd: Date;
  /** Total sessions */
  totalSessions: number;
  /** Total tokens used */
  totalTokens: number;
  /** Total estimated cost */
  totalCost: number;
  /** Most used agents */
  topAgents: Array<{ agentId: string; count: number }>;
  /** Most used tools */
  topTools: Array<{ toolName: string; count: number }>;
  /** Most executed workflows */
  topWorkflows: Array<{ workflowId: string; count: number }>;
  /** Average session duration (ms) */
  avgSessionDuration: number;
  /** Average tokens per session */
  avgTokensPerSession: number;
}

/**
 * Token pricing for cost estimation
 */
export interface TokenPricing {
  /** Model name */
  model: "haiku" | "sonnet" | "opus";
  /** Input token price per 1M tokens */
  inputPricePerMillion: number;
  /** Output token price per 1M tokens */
  outputPricePerMillion: number;
}

/**
 * Default pricing (as of Dec 2024)
 */
export const DEFAULT_PRICING: Record<string, TokenPricing> = {
  haiku: {
    model: "haiku",
    inputPricePerMillion: 0.25,
    outputPricePerMillion: 1.25,
  },
  sonnet: {
    model: "sonnet",
    inputPricePerMillion: 3.0,
    outputPricePerMillion: 15.0,
  },
  opus: {
    model: "opus",
    inputPricePerMillion: 15.0,
    outputPricePerMillion: 75.0,
  },
};

/**
 * Analytics query options
 */
export interface QueryOptions {
  /** Filter by session ID */
  sessionId?: string;
  /** Filter by agent ID */
  agentId?: string;
  /** Filter by tool name */
  toolName?: string;
  /** Filter by workflow ID */
  workflowId?: string;
  /** Start date for time range */
  startDate?: Date;
  /** End date for time range */
  endDate?: Date;
  /** Limit number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

// ============================================
// Conversation Monitor Types
// ============================================

/**
 * Configuration for conversation monitoring
 */
export interface MonitorConfig {
  /** Enable debug mode for detailed output */
  debugMode: boolean;
  /** Enable real-time streaming output */
  streamOutput: boolean;
  /** Save transcripts to storage */
  saveTranscripts: boolean;
  /** Custom storage path for transcripts */
  transcriptPath?: string;
}

/**
 * Token usage tracking per message
 */
export interface TokenUsagePerMessage {
  /** Message ID (sequence number) */
  messageId: number;
  /** Timestamp of the message */
  timestamp: Date;
  /** Input tokens for this message */
  inputTokens: number;
  /** Output tokens for this message */
  outputTokens: number;
  /** Cost for this message */
  cost: number;
  /** Model used for this message */
  model: "haiku" | "sonnet" | "opus";
  /** Cumulative input tokens so far */
  cumulativeInputTokens: number;
  /** Cumulative output tokens so far */
  cumulativeOutputTokens: number;
  /** Cumulative cost so far */
  cumulativeCost: number;
}

/**
 * Base conversation event
 */
export interface ConversationEventBase {
  /** Event type */
  type: "message" | "tool-start" | "tool-end" | "agent-decision" | "error";
  /** Timestamp of the event */
  timestamp: Date;
  /** Session ID */
  sessionId: string;
}

/**
 * Message event in conversation
 */
export interface MessageEvent extends ConversationEventBase {
  type: "message";
  data: {
    /** Message role */
    role: "user" | "assistant";
    /** Message content */
    content: string;
    /** Input tokens */
    inputTokens: number;
    /** Output tokens */
    outputTokens: number;
    /** Model used */
    model: "haiku" | "sonnet" | "opus";
    /** Cost of this message */
    cost: number;
  };
}

/**
 * Tool execution event
 */
export interface ToolEvent extends ConversationEventBase {
  type: "tool-start" | "tool-end";
  data: {
    /** Tool name */
    toolName: string;
    /** Tool input (for tool-start) */
    input?: unknown;
    /** Tool output (for tool-end) */
    output?: unknown;
    /** Duration in ms (for tool-end) */
    durationMs?: number;
    /** Success status (for tool-end) */
    success?: boolean;
    /** Error message if failed */
    error?: string;
  };
}

/**
 * Agent decision event
 */
export interface AgentDecisionEvent extends ConversationEventBase {
  type: "agent-decision";
  data: {
    /** Agent ID */
    agentId: string;
    /** Decision made */
    decision: string;
    /** Reasoning for the decision */
    reasoning?: string;
    /** Next action to take */
    nextAction: string;
  };
}

/**
 * Error event in conversation
 */
export interface ErrorEvent extends ConversationEventBase {
  type: "error";
  data: {
    /** Error message */
    message: string;
    /** Error code */
    code?: string;
    /** Stack trace */
    stack?: string;
  };
}

/**
 * Union type for all conversation events
 */
export type ConversationEvent = MessageEvent | ToolEvent | AgentDecisionEvent | ErrorEvent;

/**
 * Transcript message for storage
 */
export interface TranscriptMessage {
  /** Auto-generated ID */
  id?: number;
  /** Session ID */
  sessionId: string;
  /** Timestamp */
  timestamp: Date;
  /** Message role */
  role: "user" | "assistant" | "tool" | "system";
  /** Message content */
  content: string;
  /** Input tokens (if applicable) */
  inputTokens?: number;
  /** Output tokens (if applicable) */
  outputTokens?: number;
  /** Tool name (if role is 'tool') */
  toolName?: string;
  /** Agent ID (if applicable) */
  agentId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Transcript export format
 */
export type TranscriptExportFormat = "json" | "markdown";

/**
 * Monitor status
 */
export interface MonitorStatus {
  /** Whether monitoring is active */
  active: boolean;
  /** Current session ID */
  sessionId?: string;
  /** Number of events recorded */
  eventCount: number;
  /** Debug mode enabled */
  debugMode: boolean;
  /** Start time */
  startedAt?: Date;
}

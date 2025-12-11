/**
 * Flynn Conversation Monitor
 *
 * Real-time monitoring of Flynn conversations with event streaming.
 */

import { EventEmitter } from "node:events";
import { createLogger } from "@flynn/core";
import { type TranscriptStorage, getTranscriptStorage } from "./transcript.js";

import { DEFAULT_PRICING } from "./types.js";

import type {
  AgentDecisionEvent,
  ConversationEvent,
  ErrorEvent,
  MessageEvent,
  MonitorConfig,
  MonitorStatus,
  TokenUsagePerMessage,
  ToolEvent,
  TranscriptMessage,
} from "./types.js";

const logger = createLogger("monitor");

/**
 * PERFORMANCE: Circular buffer for bounded memory usage
 * Prevents unbounded growth of event/token history arrays
 */
class CircularBuffer<T> {
  private buffer: T[];
  private head = 0;
  private size = 0;
  private readonly capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this.size < this.capacity) {
      this.size++;
    }
  }

  toArray(): T[] {
    if (this.size === 0) return [];

    const result: T[] = [];
    const start = this.size < this.capacity ? 0 : this.head;

    for (let i = 0; i < this.size; i++) {
      const index = (start + i) % this.capacity;
      const item = this.buffer[index];
      if (item !== undefined) {
        result.push(item);
      }
    }
    return result;
  }

  get length(): number {
    return this.size;
  }

  clear(): void {
    this.buffer = new Array(this.capacity);
    this.head = 0;
    this.size = 0;
  }
}

// PERFORMANCE: Default buffer sizes (configurable)
const DEFAULT_EVENT_BUFFER_SIZE = 1000;
const DEFAULT_TOKEN_BUFFER_SIZE = 500;

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `monitor-${timestamp}-${random}`;
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
    return (inputTokens / 1_000_000) * 3.0 + (outputTokens / 1_000_000) * 15.0;
  }
  return (
    (inputTokens / 1_000_000) * pricing.inputPricePerMillion +
    (outputTokens / 1_000_000) * pricing.outputPricePerMillion
  );
}

/**
 * Conversation Monitor - Real-time event streaming
 *
 * Events emitted:
 * - 'event': ConversationEvent - Any event
 * - 'message': MessageEvent - Message events
 * - 'tool-start': ToolEvent - Tool start events
 * - 'tool-end': ToolEvent - Tool end events
 * - 'agent-decision': AgentDecisionEvent - Agent decision events
 * - 'error': ErrorEvent - Error events
 * - 'started': { sessionId: string } - Monitoring started
 * - 'stopped': { sessionId: string } - Monitoring stopped
 */
export class ConversationMonitor extends EventEmitter {
  private sessionId: string | null = null;
  private startedAt: Date | null = null;
  private debugMode = false;
  // PERFORMANCE: Use circular buffers instead of unbounded arrays
  private events: CircularBuffer<ConversationEvent>;
  private tokenHistory: CircularBuffer<TokenUsagePerMessage>;
  private cumulativeInputTokens = 0;
  private cumulativeOutputTokens = 0;
  private cumulativeCost = 0;
  private messageCounter = 0;
  private config: MonitorConfig & { eventBufferSize?: number; tokenBufferSize?: number };
  private transcriptStorage: TranscriptStorage | null = null;

  constructor(
    config: Partial<MonitorConfig & { eventBufferSize?: number; tokenBufferSize?: number }> = {},
  ) {
    super();
    this.config = {
      debugMode: config.debugMode ?? false,
      streamOutput: config.streamOutput ?? true,
      saveTranscripts: config.saveTranscripts ?? true,
      transcriptPath: config.transcriptPath,
      eventBufferSize: config.eventBufferSize ?? DEFAULT_EVENT_BUFFER_SIZE,
      tokenBufferSize: config.tokenBufferSize ?? DEFAULT_TOKEN_BUFFER_SIZE,
    };
    this.debugMode = this.config.debugMode;

    // Initialize circular buffers
    this.events = new CircularBuffer<ConversationEvent>(
      this.config.eventBufferSize ?? DEFAULT_EVENT_BUFFER_SIZE,
    );
    this.tokenHistory = new CircularBuffer<TokenUsagePerMessage>(
      this.config.tokenBufferSize ?? DEFAULT_TOKEN_BUFFER_SIZE,
    );
  }

  /**
   * Start monitoring a session
   */
  async startMonitoring(sessionId?: string): Promise<string> {
    this.sessionId = sessionId || generateSessionId();
    this.startedAt = new Date();
    // PERFORMANCE: Clear circular buffers instead of creating new arrays
    this.events.clear();
    this.tokenHistory.clear();
    this.cumulativeInputTokens = 0;
    this.cumulativeOutputTokens = 0;
    this.cumulativeCost = 0;
    this.messageCounter = 0;

    if (this.config.saveTranscripts) {
      this.transcriptStorage = getTranscriptStorage(this.config.transcriptPath);
    }

    this.emit("started", { sessionId: this.sessionId });

    if (this.debugMode) {
      logger.debug({ sessionId: this.sessionId }, "Started session");
    }

    return this.sessionId;
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (!this.sessionId) return;

    const sessionId = this.sessionId;
    this.emit("stopped", { sessionId });

    if (this.debugMode) {
      logger.debug(
        {
          sessionId,
          totalEvents: this.events.length,
          totalTokens: this.cumulativeInputTokens + this.cumulativeOutputTokens,
          totalCost: this.cumulativeCost.toFixed(4),
        },
        "Stopped session",
      );
    }

    this.sessionId = null;
    this.startedAt = null;
  }

  /**
   * Check if monitoring is active
   */
  isMonitoring(): boolean {
    return this.sessionId !== null;
  }

  /**
   * Get current status
   */
  getStatus(): MonitorStatus {
    return {
      active: this.isMonitoring(),
      sessionId: this.sessionId ?? undefined,
      eventCount: this.events.length,
      debugMode: this.debugMode,
      startedAt: this.startedAt ?? undefined,
    };
  }

  /**
   * Enable debug mode
   */
  enableDebugMode(): void {
    this.debugMode = true;
    this.config.debugMode = true;
  }

  /**
   * Disable debug mode
   */
  disableDebugMode(): void {
    this.debugMode = false;
    this.config.debugMode = false;
  }

  /**
   * Record a message event
   */
  async recordMessage(
    role: "user" | "assistant",
    content: string,
    inputTokens: number,
    outputTokens: number,
    model: "haiku" | "sonnet" | "opus" = "sonnet",
  ): Promise<void> {
    if (!this.sessionId) {
      await this.startMonitoring();
    }

    const sessionId = this.sessionId;
    if (!sessionId) return;

    const cost = estimateCost(inputTokens, outputTokens, model);
    this.cumulativeInputTokens += inputTokens;
    this.cumulativeOutputTokens += outputTokens;
    this.cumulativeCost += cost;
    this.messageCounter++;

    const event: MessageEvent = {
      type: "message",
      timestamp: new Date(),
      sessionId,
      data: {
        role,
        content,
        inputTokens,
        outputTokens,
        model,
        cost,
      },
    };

    this.events.push(event);
    this.emit("event", event);
    this.emit("message", event);

    // Track token usage per message
    const tokenUsage: TokenUsagePerMessage = {
      messageId: this.messageCounter,
      timestamp: event.timestamp,
      inputTokens,
      outputTokens,
      cost,
      model,
      cumulativeInputTokens: this.cumulativeInputTokens,
      cumulativeOutputTokens: this.cumulativeOutputTokens,
      cumulativeCost: this.cumulativeCost,
    };
    this.tokenHistory.push(tokenUsage);

    // Save to transcript storage
    if (this.config.saveTranscripts && this.transcriptStorage) {
      await this.transcriptStorage.saveMessage({
        sessionId,
        timestamp: event.timestamp,
        role,
        content,
        inputTokens,
        outputTokens,
      });
    }

    if (this.debugMode) {
      logger.debug(
        {
          role,
          contentPreview: content.substring(0, 50),
          inputTokens,
          outputTokens,
          cost: cost.toFixed(4),
        },
        "Message recorded",
      );
    }
  }

  /**
   * Record tool start event
   */
  async recordToolStart(toolName: string, input?: unknown): Promise<void> {
    if (!this.sessionId) {
      await this.startMonitoring();
    }

    const sessionId = this.sessionId;
    if (!sessionId) return;

    const event: ToolEvent = {
      type: "tool-start",
      timestamp: new Date(),
      sessionId,
      data: {
        toolName,
        input,
      },
    };

    this.events.push(event);
    this.emit("event", event);
    this.emit("tool-start", event);

    // Save to transcript storage
    if (this.config.saveTranscripts && this.transcriptStorage) {
      await this.transcriptStorage.saveMessage({
        sessionId,
        timestamp: event.timestamp,
        role: "tool",
        content: `Tool started: ${toolName}`,
        toolName,
        metadata: input ? { input } : undefined,
      });
    }

    if (this.debugMode) {
      logger.debug(
        {
          toolName,
          input: input ? JSON.stringify(input).substring(0, 100) : undefined,
        },
        "Tool started",
      );
    }
  }

  /**
   * Record tool end event
   */
  async recordToolEnd(
    toolName: string,
    result: {
      output?: unknown;
      durationMs: number;
      success: boolean;
      error?: string;
    },
  ): Promise<void> {
    if (!this.sessionId) {
      await this.startMonitoring();
    }

    const sessionId = this.sessionId;
    if (!sessionId) return;

    const event: ToolEvent = {
      type: "tool-end",
      timestamp: new Date(),
      sessionId,
      data: {
        toolName,
        output: result.output,
        durationMs: result.durationMs,
        success: result.success,
        error: result.error,
      },
    };

    this.events.push(event);
    this.emit("event", event);
    this.emit("tool-end", event);

    // Save to transcript storage
    if (this.config.saveTranscripts && this.transcriptStorage) {
      await this.transcriptStorage.saveMessage({
        sessionId,
        timestamp: event.timestamp,
        role: "tool",
        content: result.success
          ? `Tool completed: ${toolName} (${result.durationMs}ms)`
          : `Tool failed: ${toolName} - ${result.error}`,
        toolName,
        metadata: {
          durationMs: result.durationMs,
          success: result.success,
          error: result.error,
        },
      });
    }

    if (this.debugMode) {
      logger.debug(
        {
          toolName,
          success: result.success,
          durationMs: result.durationMs,
          error: result.error,
        },
        "Tool ended",
      );
    }
  }

  /**
   * Record agent decision event
   */
  async recordAgentDecision(
    agentId: string,
    decision: string,
    nextAction: string,
    reasoning?: string,
  ): Promise<void> {
    if (!this.sessionId) {
      await this.startMonitoring();
    }

    const sessionId = this.sessionId;
    if (!sessionId) return;

    const event: AgentDecisionEvent = {
      type: "agent-decision",
      timestamp: new Date(),
      sessionId,
      data: {
        agentId,
        decision,
        reasoning,
        nextAction,
      },
    };

    this.events.push(event);
    this.emit("event", event);
    this.emit("agent-decision", event);

    // Save to transcript storage
    if (this.config.saveTranscripts && this.transcriptStorage) {
      await this.transcriptStorage.saveMessage({
        sessionId,
        timestamp: event.timestamp,
        role: "system",
        content: `Agent ${agentId}: ${decision} → ${nextAction}`,
        agentId,
        metadata: { decision, reasoning, nextAction },
      });
    }

    if (this.debugMode) {
      logger.debug(
        {
          agentId,
          decision,
          reasoning,
          nextAction,
        },
        "Agent decision recorded",
      );
    }
  }

  /**
   * Record error event
   */
  async recordError(message: string, code?: string, stack?: string): Promise<void> {
    if (!this.sessionId) {
      await this.startMonitoring();
    }

    const sessionId = this.sessionId;
    if (!sessionId) return;

    const event: ErrorEvent = {
      type: "error",
      timestamp: new Date(),
      sessionId,
      data: {
        message,
        code,
        stack,
      },
    };

    this.events.push(event);
    this.emit("event", event);
    this.emit("error", event);

    // Save to transcript storage
    if (this.config.saveTranscripts && this.transcriptStorage) {
      await this.transcriptStorage.saveMessage({
        sessionId,
        timestamp: event.timestamp,
        role: "system",
        content: `Error: ${message}`,
        metadata: { code, stack },
      });
    }

    if (this.debugMode) {
      logger.error(
        {
          message,
          code,
          stack,
        },
        "Error recorded",
      );
    }
  }

  /**
   * Get all events for current session
   */
  getEvents(): ConversationEvent[] {
    return this.events.toArray();
  }

  /**
   * Get transcript (ordered events as messages)
   */
  getTranscript(): ConversationEvent[] {
    return this.events.toArray().sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get token usage history
   */
  getTokenHistory(): TokenUsagePerMessage[] {
    return this.tokenHistory.toArray();
  }

  /**
   * Get cumulative token usage
   */
  getCumulativeUsage(): {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
  } {
    return {
      inputTokens: this.cumulativeInputTokens,
      outputTokens: this.cumulativeOutputTokens,
      totalTokens: this.cumulativeInputTokens + this.cumulativeOutputTokens,
      cost: this.cumulativeCost,
    };
  }

  /**
   * Get stored transcript from database
   */
  async getStoredTranscript(sessionId?: string): Promise<TranscriptMessage[]> {
    const storage = getTranscriptStorage(this.config.transcriptPath);
    return storage.getTranscript(sessionId || this.sessionId || "");
  }

  /**
   * Export transcript to format
   */
  async exportTranscript(format: "json" | "markdown", sessionId?: string): Promise<string> {
    const storage = getTranscriptStorage(this.config.transcriptPath);
    return storage.exportTranscript(sessionId || this.sessionId || "", format);
  }
}

/**
 * Singleton instance for global monitoring
 */
let globalMonitor: ConversationMonitor | null = null;

/**
 * Get or create the global conversation monitor
 */
export function getConversationMonitor(config?: Partial<MonitorConfig>): ConversationMonitor {
  if (!globalMonitor) {
    globalMonitor = new ConversationMonitor(config);
  }
  return globalMonitor;
}

/**
 * Reset the global monitor (for testing)
 */
export function resetConversationMonitor(): void {
  if (globalMonitor) {
    globalMonitor.stopMonitoring();
    globalMonitor.removeAllListeners();
    globalMonitor = null;
  }
}

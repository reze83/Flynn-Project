/**
 * Codex Event Parsing
 *
 * Handles parsing and extraction of JSONL events from Codex CLI output.
 */

import type {
  ItemCompletedEvent,
  ParsedCodexEvent,
  ThreadStartedEvent,
  TurnCompletedEvent,
} from "./types.js";

/**
 * Parse JSONL events from Codex output
 */
export function parseJsonlEvents(output: string): ParsedCodexEvent[] {
  const events: ParsedCodexEvent[] = [];
  const lines = output.split("\n").filter((line) => line.trim());

  for (const line of lines) {
    try {
      const event = JSON.parse(line) as ParsedCodexEvent;
      events.push(event);
    } catch {
      // Skip non-JSON lines
    }
  }

  return events;
}

/**
 * Extract summary from Codex events
 */
export function extractSummary(events: ParsedCodexEvent[]): string {
  const messages: string[] = [];
  let threadId: string | undefined;
  let turnCount = 0;

  for (const event of events) {
    switch (event.type) {
      case "thread.started":
        threadId = (event as ThreadStartedEvent).thread_id;
        break;
      case "turn.started":
        turnCount++;
        break;
      case "item.completed": {
        const item = (event as ItemCompletedEvent).item;
        if (item.content) {
          messages.push(item.content);
        }
        if (item.tool_call) {
          messages.push(`[Tool: ${item.tool_call.name}]`);
        }
        break;
      }
      case "turn.completed": {
        const summary = (event as TurnCompletedEvent).summary;
        if (summary) {
          messages.push(`Summary: ${summary}`);
        }
        break;
      }
    }
  }

  return [threadId ? `Thread: ${threadId}` : "", `Turns: ${turnCount}`, messages.join("\n")]
    .filter(Boolean)
    .join("\n");
}

/**
 * Extract summary from chunk output
 */
export function extractChunkSummary(output: string): string {
  // Try to extract from JSONL events
  try {
    const lines = output.trim().split("\n");
    for (const line of lines.slice(-10)) {
      try {
        const event = JSON.parse(line) as ParsedCodexEvent;
        if (event.type === "turn.completed") {
          const turnEvent = event as TurnCompletedEvent;
          if (turnEvent.summary) {
            return turnEvent.summary;
          }
        }
      } catch {
        // Not JSON, ignore
      }
    }
  } catch {
    // Fallback: return first line
  }

  // Fallback: first meaningful line
  const firstLine = output.trim().split("\n")[0];
  return firstLine ? firstLine.substring(0, 100) : "completed";
}

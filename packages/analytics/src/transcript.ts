/**
 * Flynn Transcript Storage
 *
 * Storage for conversation transcripts with export capabilities.
 */

import { type Client, createClient } from "@libsql/client";
import type { TranscriptExportFormat, TranscriptMessage } from "./types.js";

/**
 * Storage for conversation transcripts
 */
export class TranscriptStorage {
  private client: Client;
  private initialized = false;

  constructor(dbPath = "file:flynn-transcripts.db") {
    this.client = createClient({
      url: dbPath,
    });
  }

  /**
   * Initialize database schema
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Transcripts table
    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS transcripts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        input_tokens INTEGER,
        output_tokens INTEGER,
        tool_name TEXT,
        agent_id TEXT,
        metadata TEXT
      )
    `);

    // Create indexes
    await this.client.execute(
      "CREATE INDEX IF NOT EXISTS idx_transcript_session ON transcripts(session_id)",
    );
    await this.client.execute(
      "CREATE INDEX IF NOT EXISTS idx_transcript_timestamp ON transcripts(timestamp)",
    );
    await this.client.execute(
      "CREATE INDEX IF NOT EXISTS idx_transcript_role ON transcripts(role)",
    );

    this.initialized = true;
  }

  /**
   * Save a transcript message
   */
  async saveMessage(message: TranscriptMessage): Promise<number> {
    await this.initialize();

    const result = await this.client.execute({
      sql: `
        INSERT INTO transcripts (
          session_id, timestamp, role, content, input_tokens,
          output_tokens, tool_name, agent_id, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        message.sessionId,
        message.timestamp.toISOString(),
        message.role,
        message.content,
        message.inputTokens ?? null,
        message.outputTokens ?? null,
        message.toolName ?? null,
        message.agentId ?? null,
        message.metadata ? JSON.stringify(message.metadata) : null,
      ],
    });

    return Number(result.lastInsertRowid);
  }

  /**
   * Get transcript by session ID
   */
  async getTranscript(sessionId: string): Promise<TranscriptMessage[]> {
    await this.initialize();

    const result = await this.client.execute({
      sql: `
        SELECT * FROM transcripts
        WHERE session_id = ?
        ORDER BY timestamp ASC
      `,
      args: [sessionId],
    });

    return result.rows.map((row) => ({
      id: row.id as number,
      sessionId: row.session_id as string,
      timestamp: new Date(row.timestamp as string),
      role: row.role as "user" | "assistant" | "tool" | "system",
      content: row.content as string,
      inputTokens: row.input_tokens as number | undefined,
      outputTokens: row.output_tokens as number | undefined,
      toolName: row.tool_name as string | undefined,
      agentId: row.agent_id as string | undefined,
      metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
    }));
  }

  /**
   * Search transcripts by content
   */
  async searchTranscripts(
    query: string,
    options: { sessionId?: string; limit?: number } = {},
  ): Promise<TranscriptMessage[]> {
    await this.initialize();

    let sql = `
      SELECT * FROM transcripts
      WHERE content LIKE ?
    `;
    const args: (string | number)[] = [`%${query}%`];

    if (options.sessionId) {
      sql += " AND session_id = ?";
      args.push(options.sessionId);
    }

    sql += " ORDER BY timestamp DESC";

    if (options.limit) {
      sql += " LIMIT ?";
      args.push(options.limit);
    }

    const result = await this.client.execute({ sql, args });

    return result.rows.map((row) => ({
      id: row.id as number,
      sessionId: row.session_id as string,
      timestamp: new Date(row.timestamp as string),
      role: row.role as "user" | "assistant" | "tool" | "system",
      content: row.content as string,
      inputTokens: row.input_tokens as number | undefined,
      outputTokens: row.output_tokens as number | undefined,
      toolName: row.tool_name as string | undefined,
      agentId: row.agent_id as string | undefined,
      metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
    }));
  }

  /**
   * Delete transcript by session ID
   */
  async deleteTranscript(sessionId: string): Promise<number> {
    await this.initialize();

    const result = await this.client.execute({
      sql: "DELETE FROM transcripts WHERE session_id = ?",
      args: [sessionId],
    });

    return result.rowsAffected;
  }

  /**
   * Export transcript to specified format
   */
  async exportTranscript(sessionId: string, format: TranscriptExportFormat): Promise<string> {
    const messages = await this.getTranscript(sessionId);

    if (format === "json") {
      return JSON.stringify(
        {
          sessionId,
          exportedAt: new Date().toISOString(),
          messageCount: messages.length,
          messages,
        },
        null,
        2,
      );
    }

    // Markdown format
    const lines: string[] = [
      "# Conversation Transcript",
      "",
      `**Session ID:** ${sessionId}`,
      `**Exported:** ${new Date().toISOString()}`,
      `**Messages:** ${messages.length}`,
      "",
      "---",
      "",
    ];

    for (const msg of messages) {
      const timestamp = msg.timestamp.toISOString().replace("T", " ").slice(0, 19);
      const roleIcon = {
        user: "👤",
        assistant: "🤖",
        tool: "🔧",
        system: "⚙️",
      }[msg.role];

      lines.push(`### ${roleIcon} ${msg.role.toUpperCase()} [${timestamp}]`);
      lines.push("");

      if (msg.toolName) {
        lines.push(`**Tool:** \`${msg.toolName}\``);
      }
      if (msg.agentId) {
        lines.push(`**Agent:** \`${msg.agentId}\``);
      }
      if (msg.inputTokens || msg.outputTokens) {
        lines.push(`**Tokens:** ${msg.inputTokens ?? 0} in / ${msg.outputTokens ?? 0} out`);
      }

      lines.push("");
      lines.push(msg.content);
      lines.push("");
      lines.push("---");
      lines.push("");
    }

    return lines.join("\n");
  }

  /**
   * Get all session IDs with transcripts
   */
  async listSessions(): Promise<
    Array<{ sessionId: string; messageCount: number; firstMessage: Date; lastMessage: Date }>
  > {
    await this.initialize();

    const result = await this.client.execute(`
      SELECT
        session_id,
        COUNT(*) as message_count,
        MIN(timestamp) as first_message,
        MAX(timestamp) as last_message
      FROM transcripts
      GROUP BY session_id
      ORDER BY last_message DESC
    `);

    return result.rows.map((row) => ({
      sessionId: row.session_id as string,
      messageCount: row.message_count as number,
      firstMessage: new Date(row.first_message as string),
      lastMessage: new Date(row.last_message as string),
    }));
  }

  /**
   * Get message count for a session
   */
  async getMessageCount(sessionId: string): Promise<number> {
    await this.initialize();

    const result = await this.client.execute({
      sql: "SELECT COUNT(*) as count FROM transcripts WHERE session_id = ?",
      args: [sessionId],
    });

    return (result.rows[0]?.count as number) ?? 0;
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    this.client.close();
  }
}

/**
 * Singleton instance for global transcript storage
 */
let globalStorage: TranscriptStorage | null = null;

/**
 * Get or create the global transcript storage
 */
export function getTranscriptStorage(dbPath?: string): TranscriptStorage {
  if (!globalStorage) {
    globalStorage = new TranscriptStorage(dbPath);
  }
  return globalStorage;
}

/**
 * Reset the global storage (for testing)
 */
export async function resetTranscriptStorage(): Promise<void> {
  if (globalStorage) {
    await globalStorage.close();
    globalStorage = null;
  }
}

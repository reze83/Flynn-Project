/**
 * Handoff Protocol - Versioned schema for Claude-Codex collaboration
 *
 * This module defines the data structures and helper functions for
 * managing context handoffs between Claude and Codex.
 */

import { z } from "zod";

// Protocol version
export const HANDOFF_VERSION = "1.0.0";

/**
 * Metadata schema for handoff tracking
 */
export const HandoffMetadataSchema = z.object({
  version: z.string().default(HANDOFF_VERSION),
  created: z.string().datetime().describe("ISO timestamp of creation"),
  updated: z.string().datetime().describe("ISO timestamp of last update"),
  initiator: z.enum(["claude", "codex"]).describe("Which AI initiated the handoff"),
});

/**
 * Session schema for tracking collaboration state
 */
export const HandoffSessionSchema = z.object({
  id: z.string().uuid().describe("Unique session identifier"),
  status: z.enum(["pending", "active", "completed", "failed", "paused"]).default("pending"),
  claudeConversationId: z
    .string()
    .optional()
    .describe("Claude conversation/session ID if available"),
  codexSessionId: z.string().optional().describe("Codex session ID if available"),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
});

/**
 * Input context schema for task
 */
const InputContextSchema = z.object({
  files: z.array(z.string()).default([]).describe("Relevant file paths"),
  codeSnippets: z
    .array(
      z.object({
        path: z.string(),
        content: z.string(),
        startLine: z.number().optional(),
        endLine: z.number().optional(),
      }),
    )
    .default([]),
  requirements: z.string().optional().describe("Task requirements"),
  constraints: z.array(z.string()).default([]).describe("Task constraints"),
  dependencies: z.array(z.string()).default([]).describe("Dependent task IDs"),
});

/**
 * Output context schema for task
 */
const OutputContextSchema = z.object({
  filesModified: z.array(z.string()).default([]),
  filesCreated: z.array(z.string()).default([]),
  summary: z.string().optional(),
  notes: z.array(z.string()).default([]),
  errors: z.array(z.string()).default([]),
});

/**
 * Task schema for tracking delegated work
 */
export const HandoffTaskSchema = z.object({
  id: z.string().uuid().describe("Unique task identifier"),
  description: z.string().describe("Human-readable task description"),
  assignedTo: z.enum(["claude", "codex"]).describe("Which AI is responsible"),
  status: z.enum(["pending", "in_progress", "completed", "failed", "blocked"]).default("pending"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  inputContext: InputContextSchema.default({
    files: [],
    codeSnippets: [],
    constraints: [],
    dependencies: [],
  }),
  outputContext: OutputContextSchema.default({
    filesModified: [],
    filesCreated: [],
    notes: [],
    errors: [],
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Project context schema
 */
const ProjectContextSchema = z.object({
  name: z.string().optional(),
  path: z.string().optional(),
  type: z.string().optional().describe("Project type (e.g., 'typescript', 'python')"),
  framework: z.string().optional().describe("Primary framework"),
  buildCommand: z.string().optional(),
  testCommand: z.string().optional(),
});

/**
 * Decision schema
 */
const DecisionSchema = z.object({
  description: z.string(),
  madeBy: z.enum(["claude", "codex", "user"]),
  timestamp: z.string().datetime(),
  rationale: z.string().optional(),
});

/**
 * Shared note schema
 */
const SharedNoteSchema = z.object({
  content: z.string(),
  author: z.enum(["claude", "codex"]),
  timestamp: z.string().datetime(),
});

/**
 * Memory schema for shared context between AIs
 */
export const HandoffMemorySchema = z.object({
  sharedMemoryKey: z.string().optional().describe("Mem0 memory key for shared context"),
  projectContext: ProjectContextSchema.default({}),
  decisions: z.array(DecisionSchema).default([]).describe("Key decisions made during the session"),
  sharedNotes: z.array(SharedNoteSchema).default([]).describe("Notes shared between AIs"),
});

/**
 * Complete handoff file schema
 */
export const HandoffFileSchema = z.object({
  metadata: HandoffMetadataSchema,
  session: HandoffSessionSchema,
  tasks: z.array(HandoffTaskSchema).default([]),
  memory: HandoffMemorySchema.default({
    projectContext: {},
    decisions: [],
    sharedNotes: [],
  }),
});

// Type exports
export type HandoffMetadata = z.infer<typeof HandoffMetadataSchema>;
export type HandoffSession = z.infer<typeof HandoffSessionSchema>;
export type HandoffTask = z.infer<typeof HandoffTaskSchema>;
export type HandoffMemory = z.infer<typeof HandoffMemorySchema>;
export type HandoffFile = z.infer<typeof HandoffFileSchema>;

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get current ISO timestamp
 */
function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Create a new handoff file with default values
 */
export function createHandoffFile(
  initiator: "claude" | "codex",
  projectContext?: HandoffMemory["projectContext"],
): HandoffFile {
  const now = nowISO();
  return {
    metadata: {
      version: HANDOFF_VERSION,
      created: now,
      updated: now,
      initiator,
    },
    session: {
      id: generateUUID(),
      status: "pending",
      startedAt: now,
    },
    tasks: [],
    memory: {
      projectContext: projectContext || {},
      decisions: [],
      sharedNotes: [],
    },
  };
}

/**
 * Add a task to the handoff file
 */
export function addTask(
  handoff: HandoffFile,
  task: {
    description: string;
    assignedTo: "claude" | "codex";
    priority?: "low" | "medium" | "high" | "critical";
    inputContext?: HandoffTask["inputContext"];
  },
): HandoffFile {
  const now = nowISO();
  const newTask: HandoffTask = {
    id: generateUUID(),
    description: task.description,
    assignedTo: task.assignedTo,
    status: "pending",
    priority: task.priority || "medium",
    inputContext: task.inputContext || {
      files: [],
      codeSnippets: [],
      constraints: [],
      dependencies: [],
    },
    outputContext: {
      filesModified: [],
      filesCreated: [],
      notes: [],
      errors: [],
    },
    createdAt: now,
    updatedAt: now,
  };

  return {
    ...handoff,
    metadata: {
      ...handoff.metadata,
      updated: now,
    },
    tasks: [...handoff.tasks, newTask],
  };
}

/**
 * Update a task in the handoff file
 */
export function updateTask(
  handoff: HandoffFile,
  taskId: string,
  updates: Partial<Pick<HandoffTask, "status" | "outputContext" | "priority">>,
): HandoffFile {
  const now = nowISO();
  const taskIndex = handoff.tasks.findIndex((t) => t.id === taskId);

  if (taskIndex === -1) {
    throw new Error(`Task not found: ${taskId}`);
  }

  const existingTask = handoff.tasks[taskIndex];
  if (!existingTask) {
    throw new Error(`Task not found: ${taskId}`);
  }

  const updatedTask: HandoffTask = {
    ...existingTask,
    ...updates,
    updatedAt: now,
  };

  const newTasks = [...handoff.tasks];
  newTasks[taskIndex] = updatedTask;

  return {
    ...handoff,
    metadata: {
      ...handoff.metadata,
      updated: now,
    },
    tasks: newTasks,
  };
}

/**
 * Add a decision to the handoff memory
 */
export function addDecision(
  handoff: HandoffFile,
  decision: {
    description: string;
    madeBy: "claude" | "codex" | "user";
    rationale?: string;
  },
): HandoffFile {
  const now = nowISO();
  return {
    ...handoff,
    metadata: {
      ...handoff.metadata,
      updated: now,
    },
    memory: {
      ...handoff.memory,
      decisions: [
        ...handoff.memory.decisions,
        {
          description: decision.description,
          madeBy: decision.madeBy,
          timestamp: now,
          rationale: decision.rationale,
        },
      ],
    },
  };
}

/**
 * Add a shared note
 */
export function addSharedNote(
  handoff: HandoffFile,
  content: string,
  author: "claude" | "codex",
): HandoffFile {
  const now = nowISO();
  return {
    ...handoff,
    metadata: {
      ...handoff.metadata,
      updated: now,
    },
    memory: {
      ...handoff.memory,
      sharedNotes: [
        ...handoff.memory.sharedNotes,
        {
          content,
          author,
          timestamp: now,
        },
      ],
    },
  };
}

/**
 * Update session status
 */
export function updateSessionStatus(
  handoff: HandoffFile,
  status: HandoffSession["status"],
  sessionIds?: {
    claudeConversationId?: string;
    codexSessionId?: string;
  },
): HandoffFile {
  const now = nowISO();
  return {
    ...handoff,
    metadata: {
      ...handoff.metadata,
      updated: now,
    },
    session: {
      ...handoff.session,
      status,
      ...(sessionIds?.claudeConversationId && {
        claudeConversationId: sessionIds.claudeConversationId,
      }),
      ...(sessionIds?.codexSessionId && {
        codexSessionId: sessionIds.codexSessionId,
      }),
      ...(status === "completed" && { completedAt: now }),
    },
  };
}

/**
 * Parse a handoff file from JSON string
 */
export function parseHandoffFile(json: string): HandoffFile {
  const data = JSON.parse(json);
  return HandoffFileSchema.parse(data);
}

/**
 * Serialize handoff file to JSON string
 */
export function serializeHandoffFile(handoff: HandoffFile): string {
  return JSON.stringify(handoff, null, 2);
}

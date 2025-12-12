/**
 * Task Chunking Types
 *
 * Type definitions for the task chunking and complexity analysis system.
 */

import { z } from "zod";

// ============================================================================
// Complexity Types
// ============================================================================

/**
 * Complexity levels for tasks
 */
export type ComplexityLevel = "low" | "medium" | "high" | "very-high";

/**
 * Factors used in complexity calculation
 */
export interface ComplexityFactors {
  verbCount: number;
  fileCount: number;
  conceptCount: number;
  hasMultipleSteps: boolean;
  hasDependencies: boolean;
  estimatedMinutes: number;
}

/**
 * Analysis result for task complexity
 */
export interface ComplexityAnalysis {
  level: ComplexityLevel;
  score: number; // 0-100
  factors: ComplexityFactors;
  recommendations: string[];
}

// ============================================================================
// Chunk Types
// ============================================================================

/**
 * Context for a task chunk
 */
export interface ChunkContext {
  files?: string[];
  requirements?: string;
  constraints?: string[];
  parentTask: string;
}

/**
 * Individual task chunk
 */
export interface TaskChunk {
  id: string;
  index: number;
  description: string;
  estimatedComplexity: ComplexityLevel;
  estimatedDurationMs: number;
  dependencies: string[]; // chunk IDs this depends on
  context: ChunkContext;
}

/**
 * Result of chunking a task
 */
export interface ChunkingResult {
  originalTask: string;
  requiresChunking: boolean;
  reason?: string;
  chunks: TaskChunk[];
  executionOrder: string[][]; // parallel groups of chunk IDs
  totalEstimatedDurationMs: number;
  complexity: ComplexityAnalysis;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for the chunker
 */
export interface ChunkerConfig {
  /** Maximum duration per chunk in ms (default: 120000 = 2 min) */
  maxChunkDurationMs: number;
  /** Complexity threshold for forced chunking (default: 60) */
  complexityThreshold: number;
  /** Minimum chunks to create when chunking (default: 2) */
  minChunks: number;
  /** Maximum chunks to create (default: 10) */
  maxChunks: number;
}

/**
 * Default chunker configuration
 */
export const DEFAULT_CHUNKER_CONFIG: ChunkerConfig = {
  maxChunkDurationMs: 120000, // 2 minutes
  complexityThreshold: 60,
  minChunks: 2,
  maxChunks: 10,
};

// ============================================================================
// Zod Schemas for Tool Integration
// ============================================================================

export const chunkTaskInputSchema = z.object({
  task: z.string().describe("The task description to chunk"),
  maxChunkDurationMs: z
    .number()
    .optional()
    .default(120000)
    .describe("Maximum duration per chunk in milliseconds"),
  complexityThreshold: z
    .number()
    .optional()
    .default(60)
    .describe("Complexity score threshold for forced chunking (0-100)"),
});

export const chunkTaskOutputSchema = z.object({
  requiresChunking: z.boolean(),
  reason: z.string().optional(),
  chunkCount: z.number(),
  chunks: z.array(
    z.object({
      id: z.string(),
      description: z.string(),
      estimatedDurationMs: z.number(),
      dependencies: z.array(z.string()),
    }),
  ),
  executionOrder: z.array(z.array(z.string())),
  totalEstimatedDurationMs: z.number(),
  complexityLevel: z.enum(["low", "medium", "high", "very-high"]),
  complexityScore: z.number(),
});

export type ChunkTaskInput = z.infer<typeof chunkTaskInputSchema>;
export type ChunkTaskOutput = z.infer<typeof chunkTaskOutputSchema>;

/**
 * Task Chunker Module
 *
 * Intelligent task decomposition to prevent timeouts during Codex delegation.
 * Analyzes task complexity and breaks tasks into smaller, manageable chunks.
 */

import { createLogger } from "@flynn/core";
import { z } from "zod";

const logger = createLogger("task-chunker");

// ============================================================================
// Types & Schemas
// ============================================================================

/**
 * Complexity levels for tasks
 */
export type ComplexityLevel = "low" | "medium" | "high" | "very-high";

/**
 * Analysis result for task complexity
 */
export interface ComplexityAnalysis {
  level: ComplexityLevel;
  score: number; // 0-100
  factors: {
    verbCount: number;
    fileCount: number;
    conceptCount: number;
    hasMultipleSteps: boolean;
    hasDependencies: boolean;
    estimatedMinutes: number;
  };
  recommendations: string[];
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
  context: {
    files?: string[];
    requirements?: string;
    constraints?: string[];
    parentTask: string;
  };
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

const DEFAULT_CONFIG: ChunkerConfig = {
  maxChunkDurationMs: 120000, // 2 minutes
  complexityThreshold: 60,
  minChunks: 2,
  maxChunks: 10,
};

// ============================================================================
// Action Verb Detection
// ============================================================================

/**
 * Action verbs that indicate separate tasks
 */
const ACTION_VERBS = [
  // Implementation
  "implement",
  "create",
  "build",
  "develop",
  "write",
  "add",
  "make",
  // Modification
  "update",
  "modify",
  "change",
  "edit",
  "refactor",
  "improve",
  "optimize",
  "fix",
  // Testing
  "test",
  "verify",
  "validate",
  "check",
  "ensure",
  // Documentation
  "document",
  "describe",
  "explain",
  "comment",
  // Analysis
  "analyze",
  "review",
  "audit",
  "inspect",
  "examine",
  // Setup
  "configure",
  "setup",
  "install",
  "initialize",
  // Removal
  "remove",
  "delete",
  "clean",
  "clear",
];

/**
 * Connector words that separate independent clauses
 */
const TASK_SEPARATORS = [
  " and ",
  " then ",
  " also ",
  " additionally ",
  " furthermore ",
  ", then ",
  ". ",
  "; ",
  " - ",
];

/**
 * File-related patterns
 */
const FILE_PATTERNS = [
  /(\w+\.(?:ts|js|tsx|jsx|py|go|rs|java|rb|php|vue|svelte|css|scss|html|json|yaml|yml|md))/gi,
  /(?:in|to|from|the)\s+(\w+[\w-]*)\s+(?:file|module|component|class)/gi,
  /(?:src|lib|packages?)\/[\w\-/]+/gi,
];

// ============================================================================
// Complexity Analysis
// ============================================================================

/**
 * Extract action verbs from a task description
 */
function extractActionVerbs(task: string): string[] {
  const words = task.toLowerCase().split(/\s+/);
  const found: string[] = [];

  for (const word of words) {
    const cleanWord = word.replace(/[^a-z]/g, "");
    if (ACTION_VERBS.includes(cleanWord) && !found.includes(cleanWord)) {
      found.push(cleanWord);
    }
  }

  return found;
}

/**
 * Extract file references from a task description
 */
function extractFileReferences(task: string): string[] {
  const files: Set<string> = new Set();

  for (const pattern of FILE_PATTERNS) {
    const matches = task.match(pattern);
    if (matches) {
      for (const match of matches) {
        files.add(match.trim());
      }
    }
  }

  return Array.from(files);
}

/**
 * Count conceptual components in a task
 */
function countConcepts(task: string): number {
  const conceptPatterns = [
    /\b(?:api|endpoint|route|handler)\b/gi,
    /\b(?:component|widget|view|page)\b/gi,
    /\b(?:model|schema|type|interface)\b/gi,
    /\b(?:service|provider|factory|module)\b/gi,
    /\b(?:test|spec|mock|fixture)\b/gi,
    /\b(?:config|setting|option|param)\b/gi,
    /\b(?:database|storage|cache|store)\b/gi,
    /\b(?:auth|permission|security|validation)\b/gi,
  ];

  let count = 0;
  for (const pattern of conceptPatterns) {
    const matches = task.match(pattern);
    if (matches) {
      count += new Set(matches.map((m) => m.toLowerCase())).size;
    }
  }

  return count;
}

/**
 * Check if task has multiple independent steps
 */
function hasMultipleSteps(task: string): boolean {
  for (const separator of TASK_SEPARATORS) {
    if (task.toLowerCase().includes(separator)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if task mentions dependencies between parts
 */
function hasDependencies(task: string): boolean {
  const dependencyPatterns = [
    /\b(?:after|before|once|when|then)\b/i,
    /\b(?:depends?|requires?|needs?)\b/i,
    /\b(?:first|second|third|finally|lastly)\b/i,
  ];

  for (const pattern of dependencyPatterns) {
    if (pattern.test(task)) {
      return true;
    }
  }

  return false;
}

/**
 * Estimate task duration in minutes based on complexity factors
 */
function estimateMinutes(factors: {
  verbCount: number;
  fileCount: number;
  conceptCount: number;
  hasMultipleSteps: boolean;
}): number {
  // Base time per action verb: 1-2 minutes
  let minutes = factors.verbCount * 1.5;

  // Add time per file: 0.5-1 minute
  minutes += factors.fileCount * 0.75;

  // Add time per concept: 0.5 minute
  minutes += factors.conceptCount * 0.5;

  // Multiple steps add complexity
  if (factors.hasMultipleSteps) {
    minutes *= 1.3;
  }

  // Minimum 1 minute, cap at 30 minutes
  return Math.max(1, Math.min(30, Math.round(minutes)));
}

/**
 * Calculate complexity score (0-100)
 */
function calculateComplexityScore(factors: ComplexityAnalysis["factors"]): number {
  let score = 0;

  // Action verbs (max 30 points)
  score += Math.min(30, factors.verbCount * 10);

  // Files (max 20 points)
  score += Math.min(20, factors.fileCount * 5);

  // Concepts (max 20 points)
  score += Math.min(20, factors.conceptCount * 4);

  // Multiple steps (10 points)
  if (factors.hasMultipleSteps) {
    score += 10;
  }

  // Dependencies (10 points)
  if (factors.hasDependencies) {
    score += 10;
  }

  // Duration factor (max 10 points)
  score += Math.min(10, factors.estimatedMinutes);

  return Math.min(100, score);
}

/**
 * Determine complexity level from score
 */
function getComplexityLevel(score: number): ComplexityLevel {
  if (score < 30) return "low";
  if (score < 60) return "medium";
  if (score < 80) return "high";
  return "very-high";
}

/**
 * Generate recommendations based on complexity
 */
function generateRecommendations(
  factors: ComplexityAnalysis["factors"],
  level: ComplexityLevel,
): string[] {
  const recommendations: string[] = [];

  if (level === "low") {
    recommendations.push("Task is simple enough to execute directly");
    return recommendations;
  }

  if (factors.verbCount > 2) {
    recommendations.push(`Split into ${factors.verbCount} separate tasks by action verb`);
  }

  if (factors.fileCount > 2) {
    recommendations.push(`Consider handling ${factors.fileCount} files separately`);
  }

  if (factors.hasMultipleSteps) {
    recommendations.push("Break down into sequential steps");
  }

  if (factors.hasDependencies) {
    recommendations.push("Identify and order dependencies before execution");
  }

  if (factors.estimatedMinutes > 5) {
    recommendations.push(`Estimated ${factors.estimatedMinutes} minutes - consider chunking`);
  }

  return recommendations;
}

/**
 * Analyze task complexity
 */
export function analyzeTaskComplexity(task: string): ComplexityAnalysis {
  const verbs = extractActionVerbs(task);
  const files = extractFileReferences(task);
  const concepts = countConcepts(task);
  const multipleSteps = hasMultipleSteps(task);
  const dependencies = hasDependencies(task);

  const factors: ComplexityAnalysis["factors"] = {
    verbCount: verbs.length,
    fileCount: files.length,
    conceptCount: concepts,
    hasMultipleSteps: multipleSteps,
    hasDependencies: dependencies,
    estimatedMinutes: 0,
  };

  factors.estimatedMinutes = estimateMinutes(factors);

  const score = calculateComplexityScore(factors);
  const level = getComplexityLevel(score);
  const recommendations = generateRecommendations(factors, level);

  logger.debug({ task: task.substring(0, 100), score, level, factors }, "Analyzed task complexity");

  return {
    level,
    score,
    factors,
    recommendations,
  };
}

// ============================================================================
// Task Chunking
// ============================================================================

/**
 * Split task by action verbs
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: NLP parsing algorithm with multiple separator strategies and verb context extraction
function splitByActionVerbs(task: string): string[] {
  const chunks: string[] = [];
  const verbs = extractActionVerbs(task);

  if (verbs.length <= 1) {
    return [task];
  }

  // Try to split at "and" or other separators first
  for (const separator of TASK_SEPARATORS) {
    if (task.toLowerCase().includes(separator)) {
      const parts = task.split(new RegExp(separator, "i")).filter((p) => p.trim());
      if (parts.length >= 2) {
        return parts.map((p) => p.trim());
      }
    }
  }

  // If no good split found, try to isolate each verb's context
  let remaining = task;
  for (let i = 0; i < verbs.length - 1; i++) {
    const verb = verbs[i];
    const nextVerb = verbs[i + 1];

    if (!verb || !nextVerb) continue;

    const verbIndex = remaining.toLowerCase().indexOf(verb);
    const nextVerbIndex = remaining.toLowerCase().indexOf(nextVerb);

    if (verbIndex !== -1 && nextVerbIndex > verbIndex) {
      const chunk = remaining.substring(verbIndex, nextVerbIndex).trim();
      if (chunk.length > 10) {
        chunks.push(chunk);
        remaining = remaining.substring(nextVerbIndex);
      }
    }
  }

  if (remaining.trim().length > 10) {
    chunks.push(remaining.trim());
  }

  return chunks.length > 1 ? chunks : [task];
}

/**
 * Split task by file references
 */
function splitByFiles(task: string): string[] {
  const files = extractFileReferences(task);

  if (files.length <= 1) {
    return [task];
  }

  // Create a chunk for each file mentioned
  return files.map((file) => {
    // Extract the action context around this file
    const fileIndex = task.indexOf(file);

    // Find verb before this file
    const beforeFile = task.substring(0, fileIndex).toLowerCase();
    let action = "process";
    for (const verb of ACTION_VERBS) {
      if (beforeFile.includes(verb)) {
        action = verb;
      }
    }

    return `${action} ${file}`;
  });
}

/**
 * Generate unique chunk ID
 */
function generateChunkId(index: number): string {
  return `chunk_${Date.now()}_${index}`;
}

/**
 * Build dependency graph between chunks
 * PERFORMANCE: Optimized from O(n²×m×k²) to O(n×m + n×k) using file-to-chunk index
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Graph construction algorithm with two-pass indexing strategy - complexity inherent to dependency analysis
function buildDependencyGraph(chunks: string[]): Map<number, number[]> {
  const dependencies = new Map<number, number[]>();

  // PERFORMANCE: Pre-compute file references for all chunks once
  const chunkFiles: Set<string>[] = [];
  const fileToChunks: Map<string, number[]> = new Map();

  // First pass: Extract files and build reverse index
  for (let i = 0; i < chunks.length; i++) {
    const chunkText = chunks[i];
    if (!chunkText) {
      chunkFiles.push(new Set());
      continue;
    }
    const files = new Set(extractFileReferences(chunkText.toLowerCase()));
    chunkFiles.push(files);

    // Build file-to-chunks index
    for (const file of files) {
      const existing = fileToChunks.get(file) || [];
      existing.push(i);
      fileToChunks.set(file, existing);
    }
  }

  // Second pass: Build dependencies using index
  for (let i = 0; i < chunks.length; i++) {
    const chunkText = chunks[i];
    if (!chunkText) continue;
    const chunk = chunkText.toLowerCase();
    const deps = new Set<number>();

    // Check for sequential dependency keywords
    if (chunk.includes("then") || chunk.includes("after") || chunk.includes("next")) {
      // Depends on immediately previous chunk
      if (i > 0) {
        deps.add(i - 1);
      }
    } else {
      // PERFORMANCE: Use file index for O(k) lookup instead of O(n×k²)
      const currentFiles = chunkFiles[i];
      if (currentFiles) {
        for (const file of currentFiles) {
          const chunksWithFile = fileToChunks.get(file) || [];
          for (const chunkIndex of chunksWithFile) {
            // Only add earlier chunks as dependencies
            if (chunkIndex < i) {
              deps.add(chunkIndex);
            }
          }
        }
      }
    }

    dependencies.set(i, Array.from(deps));
  }

  return dependencies;
}

/**
 * Calculate execution order (parallel groups)
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Topological sort algorithm with cycle detection and parallel grouping - complexity inherent to scheduling
function calculateExecutionOrder(
  chunks: TaskChunk[],
  dependencies: Map<number, number[]>,
): string[][] {
  const order: string[][] = [];
  const completed = new Set<number>();

  while (completed.size < chunks.length) {
    const parallelGroup: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      if (completed.has(i)) continue;

      const deps = dependencies.get(i) || [];
      const allDepsCompleted = deps.every((d) => completed.has(d));
      const currentChunk = chunks[i];

      if (allDepsCompleted && currentChunk) {
        parallelGroup.push(currentChunk.id);
      }
    }

    if (parallelGroup.length === 0) {
      // Cycle detected or error - add remaining sequentially
      for (let i = 0; i < chunks.length; i++) {
        const currentChunk = chunks[i];
        if (!completed.has(i) && currentChunk) {
          order.push([currentChunk.id]);
          completed.add(i);
        }
      }
      break;
    }

    order.push(parallelGroup);
    for (const id of parallelGroup) {
      const index = chunks.findIndex((c) => c.id === id);
      if (index !== -1) {
        completed.add(index);
      }
    }
  }

  return order;
}

/**
 * Chunk a task into smaller parts
 */
export function chunkTask(task: string, config: Partial<ChunkerConfig> = {}): ChunkingResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const complexity = analyzeTaskComplexity(task);

  logger.info({ task: task.substring(0, 80), complexity: complexity.level }, "Chunking task");

  // Determine if chunking is needed
  const shouldChunk =
    complexity.score >= cfg.complexityThreshold ||
    complexity.factors.estimatedMinutes * 60000 > cfg.maxChunkDurationMs;

  if (!shouldChunk) {
    const singleChunk: TaskChunk = {
      id: generateChunkId(0),
      index: 0,
      description: task,
      estimatedComplexity: complexity.level,
      estimatedDurationMs: complexity.factors.estimatedMinutes * 60000,
      dependencies: [],
      context: {
        parentTask: task,
      },
    };

    return {
      originalTask: task,
      requiresChunking: false,
      reason: "Task complexity below threshold",
      chunks: [singleChunk],
      executionOrder: [[singleChunk.id]],
      totalEstimatedDurationMs: complexity.factors.estimatedMinutes * 60000,
      complexity,
    };
  }

  // Try different chunking strategies
  let subtasks: string[] = [];

  // Strategy 1: Split by action verbs
  subtasks = splitByActionVerbs(task);

  // Strategy 2: If still too few chunks, try splitting by files
  if (subtasks.length < cfg.minChunks) {
    const byFiles = splitByFiles(task);
    if (byFiles.length > subtasks.length) {
      subtasks = byFiles;
    }
  }

  // Ensure we have at least minChunks
  if (subtasks.length < cfg.minChunks) {
    // Force split by estimated time
    const numChunks = Math.min(
      cfg.maxChunks,
      Math.max(
        cfg.minChunks,
        Math.ceil((complexity.factors.estimatedMinutes * 60000) / cfg.maxChunkDurationMs),
      ),
    );

    // Simple split by sentence/clause
    const sentences = task.split(/[.;]\s+/).filter((s) => s.trim().length > 5);
    if (sentences.length >= numChunks) {
      subtasks = sentences.slice(0, numChunks);
    }
  }

  // Cap at maxChunks
  if (subtasks.length > cfg.maxChunks) {
    subtasks = subtasks.slice(0, cfg.maxChunks);
  }

  // Build chunks with metadata
  const dependencyGraph = buildDependencyGraph(subtasks);
  const chunks: TaskChunk[] = subtasks.map((subtask, index) => {
    const subComplexity = analyzeTaskComplexity(subtask);
    const deps = dependencyGraph.get(index) || [];

    return {
      id: generateChunkId(index),
      index,
      description: subtask,
      estimatedComplexity: subComplexity.level,
      estimatedDurationMs: subComplexity.factors.estimatedMinutes * 60000,
      dependencies: deps.map((d) => generateChunkId(d)),
      context: {
        files: extractFileReferences(subtask),
        parentTask: task,
      },
    };
  });

  // Fix dependency IDs (they were generated with wrong indices)
  for (const chunk of chunks) {
    chunk.dependencies = (dependencyGraph.get(chunk.index) || []).map((depIndex) => {
      const depChunk = chunks[depIndex];
      return depChunk ? depChunk.id : `chunk_${depIndex}`;
    });
  }

  const executionOrder = calculateExecutionOrder(chunks, dependencyGraph);
  const totalDuration = chunks.reduce((sum, c) => sum + c.estimatedDurationMs, 0);

  logger.info(
    {
      originalTask: task.substring(0, 50),
      chunkCount: chunks.length,
      parallelGroups: executionOrder.length,
    },
    "Task chunked successfully",
  );

  return {
    originalTask: task,
    requiresChunking: true,
    reason: `Complexity score ${complexity.score} exceeds threshold ${cfg.complexityThreshold}`,
    chunks,
    executionOrder,
    totalEstimatedDurationMs: totalDuration,
    complexity,
  };
}

/**
 * Estimate task duration in milliseconds
 */
export function estimateTaskDuration(task: string): number {
  const complexity = analyzeTaskComplexity(task);
  return complexity.factors.estimatedMinutes * 60000;
}

/**
 * Identify subtasks from a task description
 */
export function identifySubtasks(task: string): string[] {
  const result = chunkTask(task);
  return result.chunks.map((c) => c.description);
}

/**
 * Check if a task needs chunking based on timeout
 */
export function needsChunking(task: string, timeoutMs: number): boolean {
  const estimated = estimateTaskDuration(task);
  const complexity = analyzeTaskComplexity(task);

  // Need chunking if estimated time > 80% of timeout or complexity is high
  return estimated > timeoutMs * 0.8 || complexity.level === "very-high";
}

// ============================================================================
// Export Zod Schemas for Tool Integration
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

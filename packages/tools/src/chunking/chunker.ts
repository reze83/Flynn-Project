/**
 * Task Chunker
 *
 * Main chunking logic that orchestrates analysis, splitting, and scheduling.
 */

import { createLogger } from "@flynn/core";
import { analyzeTaskComplexity, extractFileReferences } from "./analyzer.js";
import { calculateExecutionOrder } from "./scheduler.js";
import { buildDependencyGraph, generateChunkId, splitByActionVerbs, splitByFiles } from "./splitter.js";
import type { ChunkerConfig, ChunkingResult, TaskChunk } from "./types.js";
import { DEFAULT_CHUNKER_CONFIG } from "./types.js";

const logger = createLogger("task-chunker");

/**
 * Chunk a task into smaller parts
 */
export function chunkTask(task: string, config: Partial<ChunkerConfig> = {}): ChunkingResult {
  const cfg = { ...DEFAULT_CHUNKER_CONFIG, ...config };
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
    const numChunks = Math.min(
      cfg.maxChunks,
      Math.max(
        cfg.minChunks,
        Math.ceil((complexity.factors.estimatedMinutes * 60000) / cfg.maxChunkDurationMs),
      ),
    );

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

  // Fix dependency IDs
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

  return estimated > timeoutMs * 0.8 || complexity.level === "very-high";
}

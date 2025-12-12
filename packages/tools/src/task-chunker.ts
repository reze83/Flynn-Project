/**
 * Task Chunker Module
 *
 * This file re-exports the refactored task chunking module.
 * The implementation has been split into focused modules under ./chunking/
 *
 * @see ./chunking/index.ts - Main module entry
 * @see ./chunking/types.ts - Type definitions
 * @see ./chunking/constants.ts - Static configuration
 * @see ./chunking/analyzer.ts - Complexity analysis
 * @see ./chunking/splitter.ts - Task splitting logic
 * @see ./chunking/scheduler.ts - Execution scheduling
 * @see ./chunking/chunker.ts - Main chunking orchestration
 */

// Re-export everything from the refactored module
export {
  // Main functions
  chunkTask,
  estimateTaskDuration,
  identifySubtasks,
  needsChunking,
  // Analysis functions
  analyzeTaskComplexity,
  extractActionVerbs,
  extractFileReferences,
  countConcepts,
  hasMultipleSteps,
  hasDependencies,
  estimateMinutes,
  calculateComplexityScore,
  getComplexityLevel,
  generateRecommendations,
  // Splitting utilities
  splitByActionVerbs,
  splitByFiles,
  generateChunkId,
  buildDependencyGraph,
  // Scheduling
  calculateExecutionOrder,
  // Constants
  ACTION_VERBS,
  TASK_SEPARATORS,
  FILE_PATTERNS,
  CONCEPT_PATTERNS,
  DEPENDENCY_PATTERNS,
  COMPLEXITY_WEIGHTS,
  COMPLEXITY_THRESHOLDS,
  TIME_FACTORS,
  // Types
  type ComplexityLevel,
  type ComplexityFactors,
  type ComplexityAnalysis,
  type ChunkContext,
  type TaskChunk,
  type ChunkingResult,
  type ChunkerConfig,
  type ChunkTaskInput,
  type ChunkTaskOutput,
  // Schemas
  DEFAULT_CHUNKER_CONFIG,
  chunkTaskInputSchema,
  chunkTaskOutputSchema,
} from "./chunking/index.js";

/**
 * Task Chunking Module
 *
 * Intelligent task decomposition for preventing timeouts and managing complexity.
 * This module provides task analysis, chunking, and execution scheduling.
 */

// Main chunking functions
export {
  chunkTask,
  estimateTaskDuration,
  identifySubtasks,
  needsChunking,
} from "./chunker.js";

// Complexity analysis
export {
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
} from "./analyzer.js";

// Splitting utilities
export {
  splitByActionVerbs,
  splitByFiles,
  generateChunkId,
  buildDependencyGraph,
} from "./splitter.js";

// Scheduling
export { calculateExecutionOrder } from "./scheduler.js";

// Constants
export {
  ACTION_VERBS,
  TASK_SEPARATORS,
  FILE_PATTERNS,
  CONCEPT_PATTERNS,
  DEPENDENCY_PATTERNS,
  COMPLEXITY_WEIGHTS,
  COMPLEXITY_THRESHOLDS,
  TIME_FACTORS,
} from "./constants.js";

// Types
export type {
  ComplexityLevel,
  ComplexityFactors,
  ComplexityAnalysis,
  ChunkContext,
  TaskChunk,
  ChunkingResult,
  ChunkerConfig,
  ChunkTaskInput,
  ChunkTaskOutput,
} from "./types.js";

// Schemas
export {
  DEFAULT_CHUNKER_CONFIG,
  chunkTaskInputSchema,
  chunkTaskOutputSchema,
} from "./types.js";

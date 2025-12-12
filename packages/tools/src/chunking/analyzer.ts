/**
 * Task Complexity Analyzer
 *
 * Analyzes task descriptions to determine complexity level and factors.
 */

import { createLogger } from "@flynn/core";
import {
  ACTION_VERBS,
  COMPLEXITY_THRESHOLDS,
  COMPLEXITY_WEIGHTS,
  CONCEPT_PATTERNS,
  DEPENDENCY_PATTERNS,
  FILE_PATTERNS,
  TASK_SEPARATORS,
  TIME_FACTORS,
} from "./constants.js";
import type { ComplexityAnalysis, ComplexityFactors, ComplexityLevel } from "./types.js";

const logger = createLogger("task-analyzer");

/**
 * Extract action verbs from a task description
 */
export function extractActionVerbs(task: string): string[] {
  const words = task.toLowerCase().split(/\s+/);
  const found: string[] = [];

  for (const word of words) {
    const cleanWord = word.replace(/[^a-z]/g, "");
    if (
      ACTION_VERBS.includes(cleanWord as (typeof ACTION_VERBS)[number]) &&
      !found.includes(cleanWord)
    ) {
      found.push(cleanWord);
    }
  }

  return found;
}

/**
 * Extract file references from a task description
 */
export function extractFileReferences(task: string): string[] {
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
export function countConcepts(task: string): number {
  let count = 0;
  for (const pattern of CONCEPT_PATTERNS) {
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
export function hasMultipleSteps(task: string): boolean {
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
export function hasDependencies(task: string): boolean {
  for (const pattern of DEPENDENCY_PATTERNS) {
    if (pattern.test(task)) {
      return true;
    }
  }
  return false;
}

/**
 * Estimate task duration in minutes based on complexity factors
 */
export function estimateMinutes(factors: Omit<ComplexityFactors, "estimatedMinutes">): number {
  let minutes = factors.verbCount * TIME_FACTORS.minutesPerVerb;
  minutes += factors.fileCount * TIME_FACTORS.minutesPerFile;
  minutes += factors.conceptCount * TIME_FACTORS.minutesPerConcept;

  if (factors.hasMultipleSteps) {
    minutes *= TIME_FACTORS.multipleStepsMultiplier;
  }

  return Math.max(TIME_FACTORS.minMinutes, Math.min(TIME_FACTORS.maxMinutes, Math.round(minutes)));
}

/**
 * Calculate complexity score (0-100)
 */
export function calculateComplexityScore(factors: ComplexityFactors): number {
  let score = 0;

  // Action verbs
  score += Math.min(
    COMPLEXITY_WEIGHTS.maxVerbPoints,
    factors.verbCount * COMPLEXITY_WEIGHTS.verbPoints,
  );

  // Files
  score += Math.min(
    COMPLEXITY_WEIGHTS.maxFilePoints,
    factors.fileCount * COMPLEXITY_WEIGHTS.filePoints,
  );

  // Concepts
  score += Math.min(
    COMPLEXITY_WEIGHTS.maxConceptPoints,
    factors.conceptCount * COMPLEXITY_WEIGHTS.conceptPoints,
  );

  // Multiple steps
  if (factors.hasMultipleSteps) {
    score += COMPLEXITY_WEIGHTS.multipleStepsPoints;
  }

  // Dependencies
  if (factors.hasDependencies) {
    score += COMPLEXITY_WEIGHTS.dependenciesPoints;
  }

  // Duration factor
  score += Math.min(COMPLEXITY_WEIGHTS.maxDurationPoints, factors.estimatedMinutes);

  return Math.min(COMPLEXITY_WEIGHTS.maxScore, score);
}

/**
 * Determine complexity level from score
 */
export function getComplexityLevel(score: number): ComplexityLevel {
  if (score < COMPLEXITY_THRESHOLDS.low) return "low";
  if (score < COMPLEXITY_THRESHOLDS.medium) return "medium";
  if (score < COMPLEXITY_THRESHOLDS.high) return "high";
  return "very-high";
}

/**
 * Generate recommendations based on complexity
 */
export function generateRecommendations(
  factors: ComplexityFactors,
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

  const factors: ComplexityFactors = {
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

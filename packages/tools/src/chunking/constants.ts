/**
 * Task Chunking Constants
 *
 * Static definitions for task analysis patterns and configuration.
 */

/**
 * Action verbs that indicate separate tasks
 */
export const ACTION_VERBS = [
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
] as const;

/**
 * Connector words that separate independent clauses
 */
export const TASK_SEPARATORS = [
  " and ",
  " then ",
  " also ",
  " additionally ",
  " furthermore ",
  ", then ",
  ". ",
  "; ",
  " - ",
] as const;

/**
 * File-related patterns for extracting file references
 */
export const FILE_PATTERNS = [
  /(\w+\.(?:ts|js|tsx|jsx|py|go|rs|java|rb|php|vue|svelte|css|scss|html|json|yaml|yml|md))/gi,
  /(?:in|to|from|the)\s+(\w+[\w-]*)\s+(?:file|module|component|class)/gi,
  /(?:src|lib|packages?)\/[\w\-/]+/gi,
] as const;

/**
 * Concept patterns for counting conceptual components
 */
export const CONCEPT_PATTERNS = [
  /\b(?:api|endpoint|route|handler)\b/gi,
  /\b(?:component|widget|view|page)\b/gi,
  /\b(?:model|schema|type|interface)\b/gi,
  /\b(?:service|provider|factory|module)\b/gi,
  /\b(?:test|spec|mock|fixture)\b/gi,
  /\b(?:config|setting|option|param)\b/gi,
  /\b(?:database|storage|cache|store)\b/gi,
  /\b(?:auth|permission|security|validation)\b/gi,
] as const;

/**
 * Dependency patterns for detecting task dependencies
 */
export const DEPENDENCY_PATTERNS = [
  /\b(?:after|before|once|when|then)\b/i,
  /\b(?:depends?|requires?|needs?)\b/i,
  /\b(?:first|second|third|finally|lastly)\b/i,
] as const;

/**
 * Complexity scoring weights
 */
export const COMPLEXITY_WEIGHTS = {
  /** Points per action verb (max 30 total) */
  verbPoints: 10,
  maxVerbPoints: 30,
  /** Points per file (max 20 total) */
  filePoints: 5,
  maxFilePoints: 20,
  /** Points per concept (max 20 total) */
  conceptPoints: 4,
  maxConceptPoints: 20,
  /** Points for having multiple steps */
  multipleStepsPoints: 10,
  /** Points for having dependencies */
  dependenciesPoints: 10,
  /** Max points from duration factor */
  maxDurationPoints: 10,
  /** Maximum total score */
  maxScore: 100,
} as const;

/**
 * Complexity level thresholds
 */
export const COMPLEXITY_THRESHOLDS = {
  low: 30,
  medium: 60,
  high: 80,
} as const;

/**
 * Time estimation factors
 */
export const TIME_FACTORS = {
  /** Minutes per action verb */
  minutesPerVerb: 1.5,
  /** Minutes per file */
  minutesPerFile: 0.75,
  /** Minutes per concept */
  minutesPerConcept: 0.5,
  /** Multiplier for multiple steps */
  multipleStepsMultiplier: 1.3,
  /** Minimum estimated minutes */
  minMinutes: 1,
  /** Maximum estimated minutes */
  maxMinutes: 30,
} as const;

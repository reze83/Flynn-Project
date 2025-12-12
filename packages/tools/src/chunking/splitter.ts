/**
 * Task Splitter
 *
 * Splits complex tasks into smaller, manageable chunks.
 */

import { extractFileReferences } from "./analyzer.js";
import { ACTION_VERBS, TASK_SEPARATORS } from "./constants.js";

/**
 * Split task by action verbs
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: NLP parsing algorithm with multiple separator strategies
export function splitByActionVerbs(task: string): string[] {
  const verbs = extractActionVerbs(task);

  if (verbs.length <= 1) {
    return [task];
  }

  // Try to split at separators first
  for (const separator of TASK_SEPARATORS) {
    if (task.toLowerCase().includes(separator)) {
      const parts = task.split(new RegExp(separator, "i")).filter((p) => p.trim());
      if (parts.length >= 2) {
        return parts.map((p) => p.trim());
      }
    }
  }

  // If no good split found, try to isolate each verb's context
  const chunks: string[] = [];
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
 * Extract action verbs from task (local version to avoid circular import)
 */
function extractActionVerbs(task: string): string[] {
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
 * Split task by file references
 */
export function splitByFiles(task: string): string[] {
  const files = extractFileReferences(task);

  if (files.length <= 1) {
    return [task];
  }

  // Create a chunk for each file mentioned
  return files.map((file) => {
    const fileIndex = task.indexOf(file);
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
export function generateChunkId(index: number): string {
  return `chunk_${Date.now()}_${index}`;
}

/**
 * Build dependency graph between chunks
 * PERFORMANCE: Optimized using file-to-chunk index
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Graph construction with two-pass indexing - complexity inherent to dependency analysis
export function buildDependencyGraph(chunks: string[]): Map<number, number[]> {
  const dependencies = new Map<number, number[]>();

  // Pre-compute file references for all chunks
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

    if (chunk.includes("then") || chunk.includes("after") || chunk.includes("next")) {
      if (i > 0) {
        deps.add(i - 1);
      }
    } else {
      const currentFiles = chunkFiles[i];
      if (currentFiles) {
        for (const file of currentFiles) {
          const chunksWithFile = fileToChunks.get(file) || [];
          for (const chunkIndex of chunksWithFile) {
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

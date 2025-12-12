/**
 * Task Scheduler
 *
 * Calculates execution order for chunked tasks based on dependencies.
 */

import type { TaskChunk } from "./types.js";

/**
 * Calculate execution order (parallel groups)
 */
export function calculateExecutionOrder(
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

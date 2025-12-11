/**
 * Simple worker pool implementation
 *
 * Provides a concurrency-limited queue for executing asynchronous tasks. This
 * helper is intentionally lightweight and does not rely on Node's Worker
 * threads – which are primarily useful for CPU‑intensive tasks【273674145530292†L351-L359】. For
 * Flynn's orchestrator, many tasks are I/O bound (e.g. agent requests) and
 * therefore benefit from controlled parallel execution without blocking the
 * event loop. Use this helper to run an array of functions concurrently with
 * a maximum pool size.
 */

export type TaskFunction<T = unknown> = () => Promise<T>;

/**
 * Run an array of asynchronous tasks with a maximum number of concurrent
 * executions. Each task is a function returning a promise. Results are
 * preserved in the original order.
 *
 * @param tasks - Array of functions producing promises
 * @param poolSize - Maximum number of concurrent tasks
 * @returns Promise that resolves with an array of results
 */
export async function runTasksInPool<T>(
  tasks: TaskFunction<T>[],
  poolSize: number,
): Promise<T[]> {
  const results: Promise<T>[] = new Array(tasks.length);
  let index = 0;

  async function runNext(): Promise<void> {
    const current = index++;
    if (current >= tasks.length) return;
    try {
      // Execute the task and store the resulting promise at its index
      results[current] = tasks[current]();
    } catch (err) {
      // In case the task function throws synchronously, convert to rejected promise
      results[current] = Promise.reject(err);
    }
    // After starting this task, immediately schedule the next one
    await runNext();
  }

  // Kick off up to poolSize tasks concurrently
  const starters = [] as Promise<void>[];
  const limit = Math.min(poolSize, tasks.length);
  for (let i = 0; i < limit; i++) {
    starters.push(runNext());
  }

  // Wait for all starters to finish launching tasks
  await Promise.all(starters);
  // Wait for all task promises to settle
  return Promise.all(results);
}

/**
 * Execute tasks sequentially. Provided for symmetry with runTasksInPool and
 * clarity when a pool size of 1 is desired.
 *
 * @param tasks - Array of functions producing promises
 * @returns Promise resolving with an array of results
 */
export async function runTasksSequentially<T>(tasks: TaskFunction<T>[]): Promise<T[]> {
  const results: T[] = [];
  for (const task of tasks) {
    // Await each task in order
    // eslint-disable-next-line no-await-in-loop
    results.push(await task());
  }
  return results;
}
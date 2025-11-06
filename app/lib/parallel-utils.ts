import pLimit, { type LimitFunction } from 'p-limit';
import pMap from 'p-map';

// Limit concurrent operations to prevent overload
export const apiLimit: LimitFunction = pLimit(5); // Max 5 concurrent API calls
export const analysisLimit: LimitFunction = pLimit(10); // Max 10 concurrent analyses
export const heavyLimit: LimitFunction = pLimit(2); // Max 2 heavy operations (PDF parsing, AI analysis)

/**
 * Run multiple async operations in parallel with concurrency limit
 */
export async function parallel<T>(
  tasks: (() => Promise<T>)[],
  limit: LimitFunction = apiLimit
): Promise<T[]> {
  return Promise.all(tasks.map(task => limit(task)));
}

/**
 * Map over array with concurrency limit
 */
export async function parallelMap<T, R>(
  items: T[],
  mapper: (item: T, index: number) => Promise<R>,
  options?: { concurrency?: number }
): Promise<R[]> {
  const concurrency = options?.concurrency ?? 10;
    
  return pMap(items, mapper, { concurrency });
}

/**
 * Run independent operations in parallel
 */
export async function runInParallel<T extends Record<string, Promise<any>>>(
  operations: T
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  const keys = Object.keys(operations) as (keyof T)[];
  const values = Object.values(operations);
  
  const results = await Promise.all(values);
  
  return keys.reduce((acc, key, index) => {
    acc[key] = results[index];
    return acc;
  }, {} as { [K in keyof T]: Awaited<T[K]> });
}


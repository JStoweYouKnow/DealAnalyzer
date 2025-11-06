# Performance Optimization Recommendations

## Current Bottlenecks Identified

1. **Sequential API Calls** - Mortgage rate and AI analysis happen sequentially
2. **No Caching** - Criteria, mortgage rates, and API responses not cached
3. **PDF Parsing** - Could be faster with optimized libraries
4. **No Parallel Processing** - Independent operations run sequentially
5. **Database Operations** - No connection pooling optimization

## Recommended Dependencies

### 1. **Caching & Performance**

```bash
npm install --save \
  node-cache \
  @types/node-cache \
  p-limit \
  p-map \
  quick-lru
```

**Why:**
- `node-cache` - In-memory caching for criteria, mortgage rates, and frequently accessed data
- `p-limit` - Control concurrency for parallel operations
- `p-map` - Parallel map for batch operations
- `quick-lru` - Fast LRU cache for rate limiting and API responses

### 2. **Faster PDF Processing**

```bash
npm install --save \
  pdf2json \
  pdf-lib
```

**Why:**
- `pdf2json` - Faster PDF parsing for structured text extraction from typical server-side PDFs (~20% faster in most workloads, results vary by PDF complexity and size)
- `pdf-lib` - Fast PDF manipulation when needed

**Alternative:** Keep `pdfjs-dist` but add caching for parsed PDFs

### 3. **Parallel Processing**

```bash
npm install --save \
  @parallely/concurrent \
  async
```

**Why:**
- `@parallely/concurrent` - Easy parallel execution
- `async` - Better async utilities (parallel, waterfall, etc.)

**Note:** `worker_threads` is a built-in Node.js module (available in Node.js 12.0.0+) and does not need to be installed via npm. It can be imported directly for CPU-intensive calculations in separate threads.

### 4. **Database Optimization**

```bash
npm install --save \
  pg-pool \
  @types/pg
```

**Why:**
- Connection pooling for PostgreSQL (if using Drizzle with PostgreSQL)
- Better connection management

### 5. **HTTP Client Optimization**

```bash
npm install --save \
  undici \
  node-fetch
```

**Why:**
- `undici` - Fast HTTP client (faster than fetch in Node.js)
- Better connection pooling and keep-alive

### 6. **Memory Optimization**

```bash
npm install --save \
  stream-json \
  fast-json-stringify
```

**Why:**
- `stream-json` - Stream large JSON files instead of loading into memory
- `fast-json-stringify` - Faster JSON serialization

## Implementation Examples

### Example 1: Parallel API Calls

```typescript
import pLimit from 'p-limit';

// Limit concurrent operations
const limit = pLimit(3); // Max 3 concurrent API calls

export async function POST(request: NextRequest) {
  const body = await request.json();
  const propertyData = parseEmailContent(body.emailContent);
  
  // Run independent operations in parallel
  const [mortgageRate, criteria] = await Promise.all([
    limit(() => getMortgageRate({...})),
    limit(() => loadInvestmentCriteria()),
  ]);
  
  // Analyze property (fast, synchronous)
  const analysisData = analyzeProperty(propertyData, ..., mortgageRate, ..., criteria);
  
  // Run AI analysis in parallel with storage write (if not dependent)
  const [aiAnalysis] = await Promise.all([
    limit(() => coreAiService.analyzeProperty(analysisData.property)),
    // Storage write can happen after
  ]);
  
  // Combine and return
  const storedAnalysis = await storage.createDealAnalysis({
    ...analysisData,
    aiAnalysis
  });
}
```

### Example 2: Caching Layer with Invalidation, Stampede Prevention, and Observability

```typescript
import NodeCache from 'node-cache';
import { EventEmitter } from 'events';

// Cache instance with extended metadata
const cache = new NodeCache({ 
  stdTTL: 3600, // 1 hour default
  checkperiod: 600 // Check for expired keys every 10 minutes
});

// Event-driven invalidation (pub/sub pattern)
const cacheEvents = new EventEmitter();

// Observability: metrics tracking
const metrics = {
  cache_hit: 0,
  cache_miss: 0,
  cache_refresh: 0,
  cache_stampede_prevented: 0
};

// Stampede prevention: track in-flight refreshes per key
const refreshPromises = new Map<string, Promise<any>>();

// Event-driven invalidation: subscribe to upstream changes
cacheEvents.on('invalidate', (pattern: string) => {
  if (pattern === 'investment-criteria') {
    cache.del('investment-criteria');
    metrics.cache_refresh++;
  } else if (pattern.startsWith('mortgage-rate-')) {
    // Pattern-based invalidation for zip codes
    const keys = cache.keys().filter(k => k.startsWith(pattern));
    keys.forEach(key => cache.del(key));
    metrics.cache_refresh += keys.length;
  }
});

// Probabilistic early expiration (xFetch pattern)
function computeEarlyExpiry(ttl: number): number {
  // Refresh 10-20% before expiration (probabilistic early expiry)
  const earlyWindow = ttl * (0.1 + Math.random() * 0.1);
  return ttl - earlyWindow;
}

// Stampede-safe cache get with singleflight pattern
async function getOrRefresh<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600,
  earlyExpiryRatio: number = 0.15
): Promise<T> {
  const cached = cache.get<{ value: T; expiresAt: number; refreshAt: number }>(key);
  
  if (cached) {
    const now = Date.now();
    const isExpired = now >= cached.expiresAt;
    const shouldRefreshEarly = now >= cached.refreshAt && !isExpired;
    
    if (!isExpired && !shouldRefreshEarly) {
      metrics.cache_hit++;
      return cached.value;
    }
    
    // Early refresh: serve stale while refreshing in background
    if (shouldRefreshEarly && !isExpired) {
      metrics.cache_refresh++;
      // Refresh in background without blocking
      refreshInBackground(key, fetcher, ttl, earlyExpiryRatio);
      return cached.value; // Return stale data
    }
  }
  
  // Cache miss: check if refresh is already in-flight (stampede prevention)
  if (refreshPromises.has(key)) {
    metrics.cache_stampede_prevented++;
    return refreshPromises.get(key)!;
  }
  
  metrics.cache_miss++;
  
  // Singleflight: only first miss triggers refresh, others await
  const refreshPromise = (async () => {
    try {
      const value = await fetcher();
      const now = Date.now();
      const expiresAt = now + (ttl * 1000);
      const refreshAt = now + (ttl * 1000 * (1 - earlyExpiryRatio));
      
      cache.set(key, { value, expiresAt, refreshAt }, ttl);
      
      // Log refresh reason and TTL
      console.log(`[Cache] Refreshed key="${key}" ttl=${ttl}s reason=${cached ? 'early-expiry' : 'miss'}`);
      
      return value;
    } finally {
      refreshPromises.delete(key);
    }
  })();
  
  refreshPromises.set(key, refreshPromise);
  return refreshPromise;
}

// Background refresh for early expiry
async function refreshInBackground<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number,
  earlyExpiryRatio: number
): Promise<void> {
  if (refreshPromises.has(key)) return; // Already refreshing
  
  const refreshPromise = (async () => {
    try {
      const value = await fetcher();
      const now = Date.now();
      const expiresAt = now + (ttl * 1000);
      const refreshAt = now + (ttl * 1000 * (1 - earlyExpiryRatio));
      
      cache.set(key, { value, expiresAt, refreshAt }, ttl);
      console.log(`[Cache] Background refresh key="${key}" ttl=${ttl}s reason=early-expiry`);
    } catch (error) {
      console.error(`[Cache] Background refresh failed key="${key}"`, error);
    } finally {
      refreshPromises.delete(key);
    }
  })();
  
  refreshPromises.set(key, refreshPromise);
}

export async function loadInvestmentCriteria() {
  return getOrRefresh(
    'investment-criteria',
    async () => {
      // Fetch from DB or use default
      return DEFAULT_CRITERIA;
    },
    7200 // 2 hours TTL
  );
}

export async function getMortgageRate(params: MortgageRateParams) {
  const cacheKey = `mortgage-rate-${params.zip_code}-${params.loan_amount}`;
  
  return getOrRefresh(
    cacheKey,
    async () => {
      return await fetchMortgageRateFromAPI(params);
    },
    3600 // 1 hour TTL
  );
}

// Invalidation hooks: call these when upstream data changes
export function invalidateInvestmentCriteria() {
  cacheEvents.emit('invalidate', 'investment-criteria');
}

export function invalidateMortgageRatesForZip(zipCode: string) {
  cacheEvents.emit('invalidate', `mortgage-rate-${zipCode}`);
}

// Export metrics for monitoring
export function getCacheMetrics() {
  return {
    ...metrics,
    cache_size: cache.keys().length,
    cache_keys: cache.keys()
  };
}
```

**Usage Notes:**

1. **Event-Driven Invalidation**: Call `invalidateInvestmentCriteria()` or `invalidateMortgageRatesForZip()` when:
   - User updates investment criteria in settings
   - Mortgage rate API indicates rate changes for a zip code
   - Database updates affect cached data

2. **Stampede Prevention**: The `getOrRefresh` function uses a singleflight pattern:
   - Only the first cache miss triggers a backend fetch
   - Concurrent requests for the same key await the in-flight refresh
   - Prevents thundering herd when cache expires

3. **Probabilistic Early Expiration**: 
   - Items refresh 10-20% before expiration (configurable via `earlyExpiryRatio`)
   - Stale data served immediately while refresh happens in background
   - Reduces latency spikes when cache expires

4. **Observability**: 
   - Metrics exported via `getCacheMetrics()` for monitoring dashboards
   - Logs include key, TTL, and refresh reason (miss/early-expiry)
   - Track `cache_hit`, `cache_miss`, `cache_refresh`, and `cache_stampede_prevented` counters

### Example 3: Worker Threads for Heavy Calculations

**⚠️ Important:** Always use timeouts, proper cleanup, and worker pools for production. The basic example below shows manual worker management, but prefer a worker pool library (see "Recommended: Worker Pool" section).

#### Basic Implementation (with Timeout and Cleanup)

```typescript
// worker.ts
import { parentPort, workerData } from 'worker_threads';
import { analyzeProperty } from './property-analyzer';

try {
  const result = analyzeProperty(workerData.propertyData, ...);
  parentPort?.postMessage({ success: true, data: result });
} catch (error) {
  parentPort?.postMessage({ success: false, error: error.message });
}

// main.ts
import { Worker } from 'worker_threads';
import { analyzeProperty } from './property-analyzer';

interface WorkerMessage {
  success: boolean;
  data?: PropertyAnalysis;
  error?: string;
}

function analyzePropertyInWorker(
  propertyData: any,
  timeoutMs: number = 30000,
  fallbackToMainThread: boolean = true
): Promise<PropertyAnalysis> {
  return new Promise((resolve, reject) => {
    let worker: Worker | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let isResolved = false;

    // Cleanup function to ensure resources are released
    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (worker) {
        // Remove all listeners to prevent memory leaks
        worker.removeAllListeners();
        // Terminate the worker if it's still running
        if (worker.threadId !== -1) {
          worker.terminate().catch(() => {
            // Worker may already be terminated, ignore errors
          });
        }
        worker = null;
      }
    };

    // Handle successful completion
    const handleSuccess = (result: PropertyAnalysis) => {
      if (isResolved) return;
      isResolved = true;
      cleanup();
      resolve(result);
    };

    // Handle errors with fallback strategy
    const handleError = (error: Error) => {
      if (isResolved) return;
      isResolved = true;
      cleanup();

      // Fallback strategy: retry on main thread if enabled
      if (fallbackToMainThread) {
        console.warn(`Worker failed, falling back to main thread: ${error.message}`);
        try {
          const result = analyzeProperty(propertyData);
          resolve(result);
        } catch (fallbackError) {
          reject(new Error(`Worker failed and main thread fallback failed: ${fallbackError.message}`));
        }
      } else {
        reject(error);
      }
    };

    try {
      worker = new Worker('./worker.js', {
        workerData: { propertyData }
      });

      // Handle worker messages
      worker.on('message', (message: WorkerMessage) => {
        if (message.success && message.data) {
          handleSuccess(message.data);
        } else {
          handleError(new Error(message.error || 'Worker returned error'));
        }
      });

      // Handle worker errors - ensure cleanup and propagate to caller
      worker.on('error', (error: Error) => {
        handleError(new Error(`Worker error: ${error.message}`));
      });

      // Handle worker exit - ensure cleanup and check exit code
      worker.on('exit', (code: number) => {
        if (!isResolved) {
          if (code !== 0) {
            handleError(new Error(`Worker stopped with exit code ${code}`));
          } else {
            // Worker exited without sending a message (shouldn't happen, but handle gracefully)
            handleError(new Error('Worker exited without sending result'));
          }
        }
      });

      // Set timeout to reject and terminate hung workers
      timeoutId = setTimeout(() => {
        if (!isResolved) {
          handleError(new Error(`Worker timeout after ${timeoutMs}ms`));
        }
      }, timeoutMs);

    } catch (error) {
      // If worker creation fails, use fallback
      handleError(error instanceof Error ? error : new Error('Failed to create worker'));
    }
  });
}
```

#### Recommended: Worker Pool (Using piscina)

**Install:** `npm install piscina`

```typescript
// worker.ts (same as above)
import { parentPort, workerData } from 'worker_threads';
import { analyzeProperty } from './property-analyzer';

try {
  const result = analyzeProperty(workerData.propertyData, ...);
  parentPort?.postMessage({ success: true, data: result });
} catch (error) {
  parentPort?.postMessage({ success: false, error: error.message });
}

// main.ts with worker pool
import Piscina from 'piscina';
import { analyzeProperty } from './property-analyzer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create worker pool with concurrency limits and timeouts
const workerPool = new Piscina({
  filename: __dirname + '/worker.js',
  maxThreads: Math.max(1, Math.floor(require('os').cpus().length / 2)), // Use half of CPU cores
  minThreads: 1,
  idleTimeout: 30000, // Terminate idle workers after 30s
  maxQueue: 100, // Max queued tasks
  concurrentTasksPerWorker: 1, // One task per worker at a time
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await workerPool.destroy();
});

process.on('SIGINT', async () => {
  await workerPool.destroy();
});

async function analyzePropertyInWorker(
  propertyData: any,
  timeoutMs: number = 30000,
  fallbackToMainThread: boolean = true
): Promise<PropertyAnalysis> {
  try {
    // Run in worker pool with timeout
    const result = await Promise.race([
      workerPool.run({ propertyData }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Worker timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);

    return result as PropertyAnalysis;
  } catch (error) {
    // Fallback strategy: run on main thread or return graceful error
    if (fallbackToMainThread) {
      console.warn(`Worker pool failed, falling back to main thread: ${error instanceof Error ? error.message : 'Unknown error'}`);
      try {
        return analyzeProperty(propertyData);
      } catch (fallbackError) {
        throw new Error(`Worker pool failed and main thread fallback failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
      }
    } else {
      // Return graceful error instead of crashing
      throw new Error(`Worker pool error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Handle worker pool errors
workerPool.on('error', (error: Error) => {
  console.error('Worker pool error:', error);
  // Optionally: emit to error tracking service (e.g., Sentry)
});

// Optional: Monitor worker pool metrics
workerPool.on('drain', () => {
  console.log('Worker pool queue drained');
});
```

#### Alternative: Worker Pool with node-worker-threads-pool

**Install:** `npm install node-worker-threads-pool`

```typescript
import { StaticPool } from 'node-worker-threads-pool';
import { analyzeProperty } from './property-analyzer';

const workerPool = new StaticPool({
  size: Math.max(1, Math.floor(require('os').cpus().length / 2)),
  task: './worker.js',
});

async function analyzePropertyInWorker(
  propertyData: any,
  timeoutMs: number = 30000,
  fallbackToMainThread: boolean = true
): Promise<PropertyAnalysis> {
  try {
    const result = await Promise.race([
      workerPool.exec({ propertyData }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Worker timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
    return result as PropertyAnalysis;
  } catch (error) {
    if (fallbackToMainThread) {
      console.warn(`Worker pool failed, falling back to main thread`);
      return analyzeProperty(propertyData);
    }
    throw error;
  }
}

// Cleanup on shutdown
process.on('SIGTERM', () => workerPool.destroy());
process.on('SIGINT', () => workerPool.destroy());
```

#### Key Best Practices:

1. **Always use timeouts**: Prevent hung workers from blocking indefinitely
2. **Explicitly terminate workers**: Call `worker.terminate()` or use pool cleanup methods
3. **Handle 'error' events**: Ensure errors are caught and propagated to callers
4. **Handle 'exit' events**: Check exit codes and clean up resources
5. **Use worker pools**: Reuse workers and limit concurrency (piscina or node-worker-threads-pool)
6. **Implement fallback strategy**: Retry on main thread or return graceful errors
7. **Clean up listeners**: Remove event listeners to prevent memory leaks
8. **Monitor pool health**: Track queue size, worker availability, and errors
9. **Graceful shutdown**: Properly destroy pools on process termination
10. **Limit concurrency**: Use half of CPU cores or configure based on workload

### Example 4: Faster PDF Parsing

```typescript
import PDFParser from 'pdf2json';

async function extractTextFromPDFFast(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);
    
    pdfParser.on('pdfParser_dataError', reject);
    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      const text = pdfParser.getRawTextContent();
      resolve(text);
    });
    
    pdfParser.parseBuffer(buffer);
  });
}
```

### Example 5: Batch Processing

```typescript
import pMap from 'p-map';

// Analyze multiple properties in parallel
async function analyzeMultipleProperties(properties: Property[]) {
  return pMap(
    properties,
    async (property) => {
      const analysis = analyzeProperty(property);
      // Add AI analysis if needed
      if (process.env.OPENAI_API_KEY) {
        const aiAnalysis = await coreAiService.analyzeProperty(property);
        return { ...analysis, aiAnalysis };
      }
      return analysis;
    },
    { concurrency: 5 } // Process 5 at a time
  );
}
```

## Performance Improvements Expected

Note: Performance improvements are workload-dependent and may vary based on system resources, data size, and usage patterns.

- **Parallel API Calls**: Significant improvement for endpoints making multiple independent API calls (typically 40-60% faster, depending on network latency and call dependencies)
- **Caching**: Substantial speedup for repeated operations (typically 80-90% faster for cached criteria loading, mortgage rates, and other frequently accessed data)
- **Worker Threads**: Improved performance for CPU-intensive calculations (typically 30-50% faster for heavy computational tasks, depending on CPU cores and workload)
- **Faster PDF Parsing**: Improved PDF text extraction performance (~20% faster for structured text extraction from typical server-side PDFs, results vary by PDF complexity and size)
- **Batch Processing**: Significant improvement for processing multiple items in parallel (typically 5-10x faster for multiple property analyses, depending on concurrency limits and system resources)

## Quick Wins (Implement First)

1. ✅ **Add caching for criteria and mortgage rates** - Easy, high impact
2. ✅ **Parallelize independent API calls** - Easy, high impact  
3. ✅ **Add p-limit for concurrency control** - Easy, prevents overload
4. ⚠️ **Worker threads for heavy calculations** - Medium complexity, good for batch operations
5. ⚠️ **Faster PDF parsing** - Medium complexity, good if PDFs are common

## Installation Command

```bash
npm install --save \
  node-cache @types/node-cache \
  p-limit p-map \
  quick-lru \
  pdf2json \
  @parallely/concurrent \
  async \
  undici
```

## Priority Order

1. **High Priority (Immediate Impact)**
   - Caching layer (node-cache, quick-lru)
   - Parallel API calls (p-limit, Promise.all)
   - Fast PDF parsing (pdf2json)

2. **Medium Priority (Good ROI)**
   - Worker threads for batch operations
   - HTTP client optimization (undici)
   - Database connection pooling

3. **Low Priority (Nice to Have)**
   - Stream processing for large files
   - Advanced async utilities


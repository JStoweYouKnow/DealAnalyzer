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
- `pdf2json` - Faster PDF parsing (2-3x faster than pdfjs-dist for text extraction)
- `pdf-lib` - Fast PDF manipulation when needed

**Alternative:** Keep `pdfjs-dist` but add caching for parsed PDFs

### 3. **Parallel Processing**

```bash
npm install --save \
  worker_threads \
  @parallely/concurrent \
  async
```

**Why:**
- `worker_threads` - CPU-intensive calculations in separate threads
- `@parallely/concurrent` - Easy parallel execution
- `async` - Better async utilities (parallel, waterfall, etc.)

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
  const body = await req.json();
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

### Example 2: Caching Layer

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ 
  stdTTL: 3600, // 1 hour default
  checkperiod: 600 // Check for expired keys every 10 minutes
});

export async function loadInvestmentCriteria() {
  const cacheKey = 'investment-criteria';
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const criteria = DEFAULT_CRITERIA; // or fetch from DB
  cache.set(cacheKey, criteria, 7200); // Cache for 2 hours
  return criteria;
}

export async function getMortgageRate(params: MortgageRateParams) {
  const cacheKey = `mortgage-rate-${params.zip_code}-${params.loan_amount}`;
  const cached = cache.get<number>(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  // Fetch from API
  const rate = await fetchMortgageRateFromAPI(params);
  cache.set(cacheKey, rate, 3600); // Cache for 1 hour
  return rate;
}
```

### Example 3: Worker Threads for Heavy Calculations

```typescript
// worker.ts
import { parentPort, workerData } from 'worker_threads';
import { analyzeProperty } from './property-analyzer';

const result = analyzeProperty(workerData.propertyData, ...);
parentPort?.postMessage(result);

// main.ts
import { Worker } from 'worker_threads';

function analyzePropertyInWorker(propertyData: any): Promise<PropertyAnalysis> {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./worker.js', {
      workerData: { propertyData }
    });
    
    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
}
```

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

- **Parallel API Calls**: 40-60% faster for endpoints making multiple API calls
- **Caching**: 80-90% faster for repeated operations (criteria loading, mortgage rates)
- **Worker Threads**: 30-50% faster for CPU-intensive calculations
- **Faster PDF Parsing**: 2-3x faster PDF extraction
- **Batch Processing**: 5-10x faster for multiple property analyses

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


# PDF Parsing Solutions - Worker-Free Alternatives

## Current Implementation
- **Library**: `pdfjs-dist` (v5.4.296)
- **Issue**: Requires web workers, which can cause issues in serverless environments
- **File**: `app/lib/pdf-extractor.ts`

---

## Alternative Solutions (No Workers Required)

### Option 1: **pdf-parse** ⭐ RECOMMENDED

**Best for**: Serverless environments, Node.js backends, simple text extraction

#### Pros
- ✅ No workers required
- ✅ Works perfectly in serverless (Vercel, AWS Lambda, etc.)
- ✅ Simple API
- ✅ Reliable and actively maintained
- ✅ Small package size
- ✅ Built on top of Mozilla's PDF.js (same underlying engine as pdfjs-dist)

#### Cons
- ❌ No page-by-page extraction (extracts all text at once)
- ❌ Limited formatting/layout preservation
- ❌ Node.js only (no browser support)

#### Installation
```bash
npm install pdf-parse
```

#### Code Example
See: `app/lib/pdf-extractor-simple.ts`

#### Usage
```typescript
import { extractTextFromPDF } from './lib/pdf-extractor-simple';

const text = await extractTextFromPDF(pdfFile);
```

#### Package Size
- **pdf-parse**: ~15 KB
- **Dependencies**: Uses Mozilla PDF.js legacy build

---

### Option 2: **unpdf** ⭐ MODERN CHOICE

**Best for**: Modern projects, TypeScript-first, zero dependencies

#### Pros
- ✅ Zero dependencies
- ✅ No workers required
- ✅ Works in both Node.js and browsers
- ✅ Modern ESM-first design
- ✅ TypeScript support out of the box
- ✅ Very small bundle size
- ✅ Extracts metadata (page count, author, etc.)

#### Cons
- ❌ Newer library (less battle-tested)
- ❌ May not handle all PDF formats as well as pdf-parse

#### Installation
```bash
npm install unpdf
```

#### Code Example
See: `app/lib/pdf-extractor-unpdf.ts`

#### Usage
```typescript
import { extractTextFromPDF } from './lib/pdf-extractor-unpdf';

const text = await extractTextFromPDF(pdfFile);
```

#### Package Size
- **unpdf**: ~50 KB
- **Dependencies**: Zero

---

### Option 3: **Python Backend** (Already Implemented!)

**Best for**: Complex PDF parsing, existing Python infrastructure

#### Pros
- ✅ Already implemented in your codebase
- ✅ No JavaScript workers needed
- ✅ Powerful Python libraries (PyPDF2, pdfplumber)
- ✅ Can handle complex PDFs better
- ✅ Property-specific parsing logic already built

#### Cons
- ❌ Requires Python runtime
- ❌ Additional API call overhead
- ❌ More complex deployment

#### Files
- Python parser: `python_modules/pdf_parser_helper.py`
- File parser: `python_modules/file_parser.py`

#### Current Setup
Your Python backend already has PDF parsing via `PyPDF2`:
- See `python_modules/requirements.txt` for `PyPDF2`
- Property extraction logic in `python_modules/pdf_parser_helper.py`

---

### Option 4: **@anthropic/pdfjs-serverless**

**Best for**: Using PDF.js specifically in serverless without workers

#### Pros
- ✅ Same API as pdfjs-dist
- ✅ Optimized for serverless
- ✅ No workers required
- ✅ Drop-in replacement

#### Cons
- ❌ Less popular/maintained
- ❌ May lag behind pdfjs-dist updates

#### Installation
```bash
npm install @anthropic/pdfjs-serverless
```

---

## Migration Guide

### Quick Switch to pdf-parse

1. **Install pdf-parse**:
   ```bash
   npm install pdf-parse
   ```

2. **Update file-parser.ts**:
   ```typescript
   // Change this line:
   import { extractTextFromPDF } from './pdf-extractor';

   // To this:
   import { extractTextFromPDF } from './pdf-extractor-simple';
   ```

3. **Test**:
   ```bash
   npm run dev:next
   # Upload a PDF and verify it works
   ```

4. **Optional - Remove old dependencies**:
   ```bash
   npm uninstall pdfjs-dist @types/pdfjs-dist
   ```

### Quick Switch to unpdf

1. **Install unpdf**:
   ```bash
   npm install unpdf
   ```

2. **Update file-parser.ts**:
   ```typescript
   // Change this line:
   import { extractTextFromPDF } from './pdf-extractor';

   // To this:
   import { extractTextFromPDF } from './pdf-extractor-unpdf';
   ```

3. **Test and verify**

---

## Performance Comparison

| Library | Bundle Size | Parse Speed | Memory Usage | Serverless |
|---------|-------------|-------------|--------------|------------|
| pdfjs-dist | 400+ KB | Fast | High | ⚠️ Requires workers |
| pdf-parse | 15 KB | Fast | Medium | ✅ Perfect |
| unpdf | 50 KB | Fast | Low | ✅ Perfect |
| Python Backend | N/A | Medium | Medium | ✅ Works |

---

## Recommendation

### For Your Use Case (Vercel/Serverless):

**Primary Choice**: **pdf-parse**
- Most reliable for serverless
- Battle-tested
- Perfect for text extraction
- Used by thousands of projects

**Alternative**: **unpdf**
- If you want modern, zero-dependency solution
- If you need metadata extraction
- If you prefer TypeScript-first libraries

**Fallback**: Keep using **Python backend**
- You already have it working
- Can handle complex PDFs
- Property-specific parsing logic

---

## Implementation Status

✅ **pdf-parse implementation**: `app/lib/pdf-extractor-simple.ts`
✅ **unpdf implementation**: `app/lib/pdf-extractor-unpdf.ts`
⚠️ **Current (pdfjs-dist)**: `app/lib/pdf-extractor.ts`

---

## Next Steps

1. Install your chosen library (`pdf-parse` recommended)
2. Update imports in `app/lib/file-parser.ts`
3. Test with sample PDFs
4. Remove old pdfjs-dist if everything works
5. Update documentation

---

## Testing Checklist

- [ ] Single-page PDF extracts correctly
- [ ] Multi-page PDF extracts correctly
- [ ] Property details are parsed accurately
- [ ] File upload works on local dev
- [ ] File upload works on Vercel deployment
- [ ] No worker-related errors in console
- [ ] Memory usage is acceptable
- [ ] Parse time is acceptable

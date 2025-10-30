# PDF Parser Migration Guide - Switch from pdfjs-dist to pdf-parse

This guide will help you switch from the worker-dependent `pdfjs-dist` to the worker-free `pdf-parse` library.

## Why Switch?

Current implementation uses `pdfjs-dist` which requires web workers. This causes issues in:
- Serverless environments (Vercel, AWS Lambda)
- Build processes
- Some browser contexts

## Step-by-Step Migration

### Step 1: Install pdf-parse

```bash
npm install pdf-parse
```

### Step 2: Backup Current Implementation (Optional)

```bash
# Rename current extractor as backup
mv app/lib/pdf-extractor.ts app/lib/pdf-extractor.backup.ts
```

### Step 3: Rename New Implementation

```bash
# Make the simple extractor the primary one
mv app/lib/pdf-extractor-simple.ts app/lib/pdf-extractor.ts
```

**OR** manually update `app/lib/pdf-extractor.ts` with this content:

```typescript
// PDF text extraction using pdf-parse (no workers required)
export async function extractTextFromPDF(file: File | Buffer | ArrayBuffer): Promise<string> {
  try {
    console.log('Starting PDF extraction with pdf-parse...');

    // Dynamically import pdf-parse only when needed
    const pdfParse = (await import('pdf-parse')).default;

    let buffer: Buffer;

    if (file instanceof File) {
      console.log('Converting File to Buffer, size:', file.size);
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (file instanceof Buffer) {
      buffer = file;
    } else {
      buffer = Buffer.from(file);
    }

    // Validate buffer
    if (!buffer || buffer.length === 0) {
      throw new Error('PDF file is empty or invalid');
    }

    console.log('Parsing PDF with buffer size:', buffer.length);

    // Parse the PDF
    const data = await pdfParse(buffer);

    console.log('PDF parsed successfully:', {
      pages: data.numpages,
      textLength: data.text.length,
    });

    return data.text.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

### Step 4: No Other Changes Needed!

The function signature is identical, so no changes needed in:
- ✅ `app/api/analyze-file/route.ts` - Already uses `extractTextFromPDF`
- ✅ Any other files that import from `pdf-extractor.ts`

### Step 5: Test

```bash
# Start dev server
npm run dev:next

# Test PDF upload in the analyzer form
# Upload various PDFs to ensure they parse correctly
```

### Step 6: Remove Old Dependencies (Optional)

Once you've verified everything works:

```bash
npm uninstall pdfjs-dist @types/pdfjs-dist
```

This will save ~400KB in your bundle size!

### Step 7: Clean Up (Optional)

```bash
# Remove backup files if everything works
rm app/lib/pdf-extractor.backup.ts
rm app/lib/pdf-extractor-unpdf.ts  # if not using
```

## Verification Checklist

After migration, verify:

- [ ] PDF files upload successfully
- [ ] Text is extracted from PDFs
- [ ] Property data is parsed correctly
- [ ] No worker-related errors in console
- [ ] Works in production/Vercel deployment
- [ ] Memory usage is acceptable
- [ ] Parse time is reasonable

## Troubleshooting

### Issue: "Cannot find module 'pdf-parse'"

**Solution**: Make sure you installed it:
```bash
npm install pdf-parse
```

### Issue: "Buffer is not defined"

**Solution**: This should not happen in Node.js environments. If you see this in browser code, make sure you're only using the PDF extractor server-side.

### Issue: PDF text is garbled or missing

**Solution**:
1. Check if the PDF is scanned (image-based) - text extraction only works on text PDFs
2. Try the unpdf alternative: `app/lib/pdf-extractor-unpdf.ts`
3. Consider using the Python backend for complex PDFs

### Issue: Out of memory errors

**Solution**:
- Large PDFs (>50MB) may cause issues
- Consider splitting PDFs or using streaming approaches
- Increase memory limits in your deployment environment

## Rollback Plan

If you need to rollback:

1. Restore the backup:
   ```bash
   cp app/lib/pdf-extractor.backup.ts app/lib/pdf-extractor.ts
   ```

2. Reinstall pdfjs-dist:
   ```bash
   npm install pdfjs-dist @types/pdfjs-dist
   ```

3. Restart dev server

## Alternative: Use unpdf Instead

If pdf-parse doesn't work well, try unpdf:

1. Install:
   ```bash
   npm install unpdf
   ```

2. Use the unpdf implementation:
   ```bash
   mv app/lib/pdf-extractor-unpdf.ts app/lib/pdf-extractor.ts
   ```

## Performance Comparison

| Metric | pdfjs-dist (old) | pdf-parse (new) |
|--------|------------------|-----------------|
| Bundle Size | 400+ KB | 15 KB |
| Workers | Required | Not required |
| Serverless | ⚠️ Issues | ✅ Perfect |
| Parse Speed | Fast | Fast |
| Setup Complexity | High | Low |

## Questions?

- Check `PDF_PARSING_COMPARISON.md` for detailed comparison
- Review implementation files:
  - `app/lib/pdf-extractor-simple.ts` (pdf-parse)
  - `app/lib/pdf-extractor-unpdf.ts` (unpdf alternative)
- Python alternative: `python_modules/pdf_parser_helper.py`

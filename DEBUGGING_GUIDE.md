# Debugging Guide - 404 and 400 Errors

## Errors Encountered

1. **404 Error**: "Failed to load resource: the server responded with a status of 404"
2. **400 Error**: "/api/analyze-file: Failed to load resource: the server responded with a status of 400"

---

## Quick Fixes Applied

### ✅ 1. Simplified PDF Extractor
- **File**: `app/lib/pdf-extractor.ts`
- **Change**: Replaced complex worker-handling code with simple pdf-parse implementation
- **Why**: Worker issues were causing PDF extraction to fail in serverless environments

### ✅ 2. Confirmed pdf-parse Installation
- **Package**: `pdf-parse@2.4.5` is installed
- **Status**: ✅ Installed

---

## Debugging Steps

### Step 1: Check Server Console Logs

When you see these errors, check your Next.js dev server console for detailed error messages:

```bash
# Look for these types of messages in the server console:
- "Error in analyze-file endpoint:"
- "Error reading/extracting file:"
- "No file found in formData"
```

### Step 2: Check Browser Network Tab

Open browser DevTools (F12) → Network tab:

1. **For 404 Error**:
   - Look for the failed request
   - Check the URL - is it requesting a file that doesn't exist?
   - Common causes:
     - Missing static asset (image, font, CSS)
     - Incorrect route path
     - Build artifact not generated

2. **For 400 Error** (`/api/analyze-file`):
   - Click on the failed request
   - Go to "Response" tab to see the error message
   - Common causes:
     - No file selected when clicking "Analyze"
     - File too large (>50MB)
     - Invalid file type
     - PDF extraction failed

### Step 3: Check Browser Console

Look for JavaScript errors in the browser console:

```javascript
// Common errors to look for:
- "Cannot read property of undefined"
- "FormData append failed"
- "File is null"
```

---

## Common Issues & Solutions

### Issue 1: 400 Error - "No file uploaded"

**Cause**: Form submitted without selecting a file

**Solution**:
1. Make sure you select a file before clicking "Analyze Property"
2. Check that the file input is working:
   ```javascript
   // In browser console:
   document.getElementById('file-upload').files[0]
   // Should show the selected file
   ```

**Code Check**: [analyzer-form.tsx:72-75](app/components/analyzer-form.tsx#L72-L75)
```typescript
if (!selectedFile) {
  alert("Please select a file first");
  return;
}
```

---

### Issue 2: 400 Error - PDF Extraction Failed

**Cause**: PDF is image-based, encrypted, or corrupted

**Error Message**: "Failed to extract text from PDF"

**Solutions**:
1. **Test with a text-based PDF** (not a scanned image)
2. **Check PDF is not encrypted** (password protected)
3. **Try a smaller PDF** (<10MB to start)

**Test PDF**:
Create a simple test PDF with text to verify the extractor works:
```bash
# Use any PDF with actual text (not images)
```

---

### Issue 3: 404 Error - Missing Static Assets

**Cause**: Build artifacts or static files missing

**Check**:
```bash
# Make sure Next.js built properly
npm run build:next

# Check for missing public files
ls -la public/
```

**Common Missing Files**:
- Favicon
- Fonts
- Images referenced in CSS
- Source maps

---

### Issue 4: Worker-Related Errors (Should be fixed now)

**Symptom**: Errors mentioning "worker", "Worker", or "GlobalWorkerOptions"

**Status**: ✅ **FIXED** by simplifying pdf-extractor.ts

**Verification**:
```bash
# Check that the simplified version is in use
head -5 app/lib/pdf-extractor.ts
# Should show: "// PDF text extraction using pdf-parse (no workers required)"
```

---

## Testing Checklist

Use this checklist to verify everything works:

### Basic Functionality
- [ ] Next.js dev server starts without errors: `npm run dev:next`
- [ ] Homepage loads at `http://localhost:3002`
- [ ] No console errors on page load
- [ ] File input appears and is clickable

### File Upload
- [ ] Can select a PDF file
- [ ] File name appears after selection
- [ ] "Analyze Property" button is enabled
- [ ] Clicking button shows loading state

### PDF Processing
- [ ] Server console shows "Starting PDF extraction with pdf-parse..."
- [ ] Server console shows "PDF parsed successfully"
- [ ] No worker-related errors
- [ ] Text extracted successfully

### Analysis Results
- [ ] Analysis completes without errors
- [ ] Results display on the page
- [ ] COC Return, Cap Rate calculated
- [ ] "Meets Criteria" badge shown

---

## Specific Debugging Commands

### Check Server Logs
```bash
# Start dev server and watch for errors
npm run dev:next

# Look for these log messages:
# ✅ Good: "PDF parsed successfully"
# ❌ Bad: "Error extracting text from PDF"
```

### Test API Endpoint Directly
```bash
# Create a test PDF file first, then:
curl -X POST http://localhost:3002/api/analyze-file \
  -F "file=@test.pdf" \
  -F "fundingSource=conventional"

# Should return JSON with success: true
```

### Check File Permissions
```bash
# Make sure the app can read files
ls -la app/lib/pdf-extractor.ts
ls -la app/api/analyze-file/route.ts

# Both should be readable (r--)
```

---

## Quick Diagnostic Script

Run this in your browser console to diagnose issues:

```javascript
// Check if file is selected
const fileInput = document.getElementById('file-upload');
console.log('File selected:', fileInput?.files[0]?.name);

// Check form state
const form = document.querySelector('form');
console.log('Form exists:', !!form);

// Test API endpoint
fetch('/api/analyze-file', {
  method: 'POST',
  body: new FormData()  // Empty, should return 400 with message
})
.then(r => r.json())
.then(d => console.log('API Response:', d))
.catch(e => console.error('API Error:', e));
```

---

## Still Having Issues?

### 1. Check Next.js Build

```bash
# Kill existing server
pkill -f "next dev"

# Clean build
rm -rf .next
npm run build:next

# Restart dev server
npm run dev:next
```

### 2. Check Package Dependencies

```bash
# Verify pdf-parse is installed
npm list pdf-parse

# Reinstall if needed
npm uninstall pdf-parse
npm install pdf-parse
```

### 3. Check File Size Limit

The API has a 50MB file size limit. Check your PDF:

```bash
# Check file size
ls -lh your-file.pdf

# If over 50MB, try a smaller file first
```

### 4. Enable Verbose Logging

In `app/api/analyze-file/route.ts`, all console.log statements are already enabled. Check your server console for detailed logs.

---

## Error Messages & What They Mean

### "No file uploaded"
→ File was not attached to the form submission
→ **Fix**: Select a file before clicking Analyze

### "PDF file is empty or invalid"
→ File buffer is empty or file is corrupted
→ **Fix**: Try a different PDF file

### "File does not appear to be a valid PDF"
→ File doesn't have PDF magic bytes (%PDF)
→ **Fix**: Make sure the file is actually a PDF

### "No text could be extracted from PDF"
→ PDF is image-based or encrypted
→ **Fix**: Use a text-based PDF or convert scanned PDF to text

### "Failed to extract text from PDF: [error]"
→ pdf-parse encountered an error
→ **Fix**: Check server console for detailed error, try simpler PDF

### "File size exceeds maximum allowed size of 50MB"
→ File is too large
→ **Fix**: Use a smaller file or increase limit in code

---

## Success Indicators

When everything works, you should see:

**Server Console**:
```
=== Analyze File API Called ===
File received: { name: 'property.pdf', size: 123456, type: 'application/pdf' }
Starting PDF extraction with pdf-parse...
Importing pdf-parse...
pdf-parse imported successfully
Parsing PDF...
PDF parsed successfully: { pages: 1, textLength: 1234, info: {...} }
Analysis Results: { meetsCriteria: true, cocReturn: 0.15, ... }
```

**Browser Console**:
```
No errors
```

**UI**:
- Loading spinner disappears
- Analysis results appear
- Green success toast notification
- Property details displayed

---

## Contact Points

If you're still stuck after trying these steps:
1. Check the server console output (most informative)
2. Check the browser network tab for response details
3. Try the Quick Diagnostic Script above
4. Provide the specific error message and stack trace

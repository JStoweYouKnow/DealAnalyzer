/**
 * Lazy loading utilities for heavy dependencies
 */

// Lazy load PDF extractor (heavy library)
let pdfExtractorPromise: Promise<typeof import('./pdf-extractor')> | null = null;

export async function getPdfExtractor() {
  if (!pdfExtractorPromise) {
    pdfExtractorPromise = import('./pdf-extractor');
  }
  return pdfExtractorPromise;
}

// Lazy load AI service (only when needed)
let aiServicePromise: Promise<any> | null = null;

export async function getAiService() {
  if (!aiServicePromise) {
    // Use dynamic import with proper path resolution
    aiServicePromise = import('../../server/ai-service');
  }
  return aiServicePromise;
}

// Lazy load ExcelJS (only when processing Excel files)
let excelJSPromise: Promise<typeof import('exceljs')> | null = null;

export async function getExcelJS() {
  if (!excelJSPromise) {
    excelJSPromise = import('exceljs');
  }
  return excelJSPromise;
}


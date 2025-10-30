// PDF text extraction utility using pdf-parse (no workers required)
// This is a simpler alternative to pdfjs-dist that works better in serverless environments

// pdf-parse exports PDFParse class, but we use dynamic require for compatibility
let pdfParse: any;

// Initialize pdf-parse dynamically (handles both ESM and CJS)
async function getPdfParse() {
  if (!pdfParse) {
    try {
      // Try ESM import first
      const pdfParseModule = await import('pdf-parse');
      pdfParse = pdfParseModule.default || pdfParseModule.PDFParse || pdfParseModule;
    } catch {
      // Fallback to require for CommonJS
      pdfParse = require('pdf-parse');
    }
  }
  return pdfParse;
}

export async function extractTextFromPDF(file: File | Buffer | ArrayBuffer): Promise<string> {
  try {
    console.log('Starting PDF extraction with pdf-parse...');
    
    let buffer: Buffer;
    
    if (file instanceof File) {
      console.log('Converting File to Buffer, size:', file.size);
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      console.log('Buffer created, length:', buffer.length);
    } else if (file instanceof Buffer) {
      buffer = file;
    } else if (file instanceof ArrayBuffer) {
      buffer = Buffer.from(file);
    } else {
      throw new Error('Unsupported file type');
    }

    // Validate buffer
    if (!buffer || buffer.length === 0) {
      throw new Error('PDF file is empty or invalid');
    }

    // Check PDF magic bytes
    const firstBytes = buffer.slice(0, 4);
    const pdfMagicBytes = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF
    const isPDF = firstBytes.equals(pdfMagicBytes);
    
    console.log('PDF magic bytes check:', {
      firstBytes: Array.from(firstBytes),
      isPDF
    });
    
    if (!isPDF) {
      throw new Error('File does not appear to be a valid PDF (missing PDF magic bytes)');
    }

    // Parse PDF using pdf-parse
    console.log('Parsing PDF with pdf-parse...');
    const pdfParseFn = await getPdfParse();
    const pdfData = await pdfParseFn(buffer, {
      // Options for better text extraction
      max: 0, // Parse all pages (0 = unlimited)
    });
    
    console.log('PDF parsed successfully:', {
      pages: pdfData.numpages,
      info: pdfData.info,
      metadata: pdfData.metadata,
      textLength: pdfData.text?.length || 0
    });

    if (!pdfData.text || pdfData.text.trim().length === 0) {
      throw new Error('No text could be extracted from PDF. The PDF may be image-based or encrypted.');
    }

    const extractedText = pdfData.text.trim();
    console.log(`PDF text extracted successfully - length: ${extractedText.length} characters`);
    console.log(`PDF text preview (first 500 chars): ${extractedText.substring(0, 500)}`);
    
    return extractedText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to extract text from PDF: ${errorMessage}`);
  }
}

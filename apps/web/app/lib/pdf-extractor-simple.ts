// PDF text extraction utility using pdf-parse (no workers required)
// This is a simpler alternative to pdfjs-dist that works better in serverless environments

// Polyfill DOMMatrix for Node.js/serverless environments
if (typeof globalThis.DOMMatrix === 'undefined') {
  // Simple DOMMatrix polyfill for pdf-parse
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    
    constructor(init?: string | number[]) {
      if (typeof init === 'string') {
        const matrix = init.match(/matrix\(([^)]+)\)/);
        if (matrix) {
          const values = matrix[1].split(',').map(v => parseFloat(v.trim()));
          if (values.length === 6) {
            this.a = values[0]; this.b = values[1]; this.c = values[2];
            this.d = values[3]; this.e = values[4]; this.f = values[5];
          }
        }
      } else if (Array.isArray(init) && init.length === 6) {
        this.a = init[0]; this.b = init[1]; this.c = init[2];
        this.d = init[3]; this.e = init[4]; this.f = init[5];
      }
    }
    
    multiply(other: any) {
      const result = new (globalThis as any).DOMMatrix();
      result.a = this.a * other.a + this.c * other.b;
      result.b = this.b * other.a + this.d * other.b;
      result.c = this.a * other.c + this.c * other.d;
      result.d = this.b * other.c + this.d * other.d;
      result.e = this.a * other.e + this.c * other.f + this.e;
      result.f = this.b * other.e + this.d * other.f + this.f;
      return result;
    }
    
    toString() {
      return `matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.e}, ${this.f})`;
    }
  };
}

// Polyfill DOMPoint for Node.js/serverless environments
if (typeof globalThis.DOMPoint === 'undefined') {
  (globalThis as any).DOMPoint = class DOMPoint {
    x = 0; y = 0; z = 0; w = 1;
    
    constructor(x = 0, y = 0, z = 0, w = 1) {
      this.x = x; this.y = y; this.z = z; this.w = w;
    }
  };
}

// pdf-parse exports PDFParse class, but we use dynamic require for compatibility
// pdf-parse's default export in CommonJS is the function we need
let pdfParse: any;

// Initialize pdf-parse dynamically (handles both ESM and CJS)
async function getPdfParse() {
  if (!pdfParse) {
    try {
      // Use require for CommonJS compatibility (works in Next.js serverless)
      pdfParse = require('pdf-parse');
    } catch {
      // Fallback to dynamic import if require fails
      const pdfParseModule = await import('pdf-parse');
      pdfParse = (pdfParseModule as any).default || pdfParseModule.PDFParse || pdfParseModule;
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

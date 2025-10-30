// PDF text extraction using pdf-parse (no workers required)
// Simplified implementation for serverless compatibility

// Polyfill DOMMatrix for Node.js/serverless environments
// pdf-parse uses pdfjs-dist internally which requires DOMMatrix
if (typeof globalThis.DOMMatrix === 'undefined') {
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;

    constructor(init?: string | number[]) {
      if (typeof init === 'string') {
        const matrix = init.match(/matrix\(([^)]+)\)/);
        if (matrix) {
          const values = matrix[1].split(',').map(v => parseFloat(v.trim()));
          if (values.length === 6) {
            [this.a, this.b, this.c, this.d, this.e, this.f] = values;
          }
        }
      } else if (Array.isArray(init) && init.length === 6) {
        [this.a, this.b, this.c, this.d, this.e, this.f] = init;
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

// Type declaration for pdf-parse
type PdfParseFunction = (dataBuffer: Buffer, options?: { max?: number; version?: string }) => Promise<{
  numpages: number;
  numrender: number;
  info: any;
  metadata: any;
  text: string;
  version: string;
}>;

export async function extractTextFromPDF(file: File | Buffer | ArrayBuffer): Promise<string> {
  try {
    console.log('Starting PDF extraction with pdf-parse...');

    // Convert to Buffer
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
    const firstBytes = buffer.subarray(0, 4);
    const pdfMagicBytes = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF
    const isPDF = firstBytes.equals(pdfMagicBytes);

    console.log('PDF magic bytes check:', {
      firstBytes: Array.from(firstBytes),
      isPDF
    });

    if (!isPDF) {
      throw new Error('File does not appear to be a valid PDF (missing PDF magic bytes)');
    }

    // Import pdf-parse dynamically
    console.log('Importing pdf-parse...');
    // pdf-parse exports as CommonJS, need to use require for Node.js compatibility
    const pdfParse = require('pdf-parse') as PdfParseFunction;
    console.log('pdf-parse imported successfully');

    // Parse PDF
    console.log('Parsing PDF...');
    const pdfData = await pdfParse(buffer, {
      max: 0, // Parse all pages (0 = no limit)
      version: 'default', // Use default version
    });

    console.log('PDF parsed successfully:', {
      pages: pdfData.numpages,
      textLength: pdfData.text?.length || 0,
      info: pdfData.info,
    });

    if (!pdfData.text || pdfData.text.trim().length === 0) {
      throw new Error('No text could be extracted from PDF. The PDF may be image-based or encrypted.');
    }

    const extractedText = pdfData.text.trim();
    console.log(`PDF text extracted successfully - length: ${extractedText.length} characters`);
    console.log(`PDF text preview (first 200 chars): ${extractedText.substring(0, 200)}`);

    return extractedText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);

    // Provide more detailed error information
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }

    throw new Error('Failed to extract text from PDF: Unknown error');
  }
}

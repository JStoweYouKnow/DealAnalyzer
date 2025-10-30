// PDF text extraction using pdf-parse (no workers required)
// Simplified implementation for serverless compatibility

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

    // Import pdf-parse dynamically
    console.log('Importing pdf-parse...');
    const pdfParse = (await import('pdf-parse')).default;
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

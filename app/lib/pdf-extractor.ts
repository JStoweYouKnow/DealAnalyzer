// PDF text extraction using unpdf (truly worker-free!)
// unpdf is a modern, zero-dependency PDF parser that works perfectly in serverless

export async function extractTextFromPDF(file: File | Buffer | ArrayBuffer): Promise<string> {
  try {
    console.log('Starting PDF extraction with unpdf...');

    // Convert to Uint8Array (unpdf expects Uint8Array)
    let data: Uint8Array;

    if (file instanceof File) {
      console.log('Converting File to Uint8Array, size:', file.size);
      const arrayBuffer = await file.arrayBuffer();
      data = new Uint8Array(arrayBuffer);
      console.log('Uint8Array created, length:', data.length);
    } else if (file instanceof Buffer) {
      data = new Uint8Array(file);
    } else if (file instanceof ArrayBuffer) {
      data = new Uint8Array(file);
    } else {
      throw new Error('Unsupported file type');
    }

    // Validate data
    if (!data || data.length === 0) {
      throw new Error('PDF file is empty or invalid');
    }

    // Check PDF magic bytes
    const firstBytes = data.subarray(0, 4);
    const pdfMagicBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
    const isPDF = firstBytes.every((byte, i) => byte === pdfMagicBytes[i]);

    console.log('PDF magic bytes check:', {
      firstBytes: Array.from(firstBytes),
      isPDF
    });

    if (!isPDF) {
      throw new Error('File does not appear to be a valid PDF (missing PDF magic bytes)');
    }

    // Import unpdf dynamically
    console.log('Importing unpdf...');
    const { extractText } = await import('unpdf');
    console.log('unpdf imported successfully');

    // Extract text from PDF
    console.log('Parsing PDF with unpdf...');
    const result = await extractText(data);
    const text = result.text;

    console.log('PDF parsed successfully:', {
      textLength: text?.length || 0,
    });

    if (!text || text.trim().length === 0) {
      throw new Error('No text could be extracted from PDF. The PDF may be image-based or encrypted.');
    }

    const extractedText = text.trim();
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

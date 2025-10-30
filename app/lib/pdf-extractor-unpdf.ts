// PDF text extraction using unpdf (no workers, zero dependencies)
// Modern and lightweight alternative

export async function extractTextFromPDF(file: File | Buffer | ArrayBuffer): Promise<string> {
  try {
    console.log('Starting PDF extraction with unpdf...');

    // Dynamically import unpdf
    const { getTextFromPDF } = await import('unpdf');

    let buffer: Uint8Array;

    if (file instanceof File) {
      console.log('Converting File to Uint8Array, size:', file.size);
      const arrayBuffer = await file.arrayBuffer();
      buffer = new Uint8Array(arrayBuffer);
    } else if (file instanceof Buffer) {
      buffer = new Uint8Array(file);
    } else {
      buffer = new Uint8Array(file);
    }

    // Validate buffer
    if (!buffer || buffer.length === 0) {
      throw new Error('PDF file is empty or invalid');
    }

    console.log('Parsing PDF with buffer size:', buffer.length);

    // Extract text from PDF
    const text = await getTextFromPDF(buffer);

    console.log('PDF parsed successfully, text length:', text.length);

    return text.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Alternative: Extract metadata along with text
export async function extractPDFData(file: File | Buffer | ArrayBuffer): Promise<{
  text: string;
  totalPages?: number;
  metadata?: Record<string, any>;
}> {
  try {
    const { extractPDFData: extract } = await import('unpdf');

    let buffer: Uint8Array;

    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = new Uint8Array(arrayBuffer);
    } else if (file instanceof Buffer) {
      buffer = new Uint8Array(file);
    } else {
      buffer = new Uint8Array(file);
    }

    const data = await extract(buffer);

    return {
      text: data.text || '',
      totalPages: data.totalPages,
      metadata: data.meta,
    };
  } catch (error) {
    console.error('Error extracting PDF data:', error);
    throw new Error(`Failed to extract PDF data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

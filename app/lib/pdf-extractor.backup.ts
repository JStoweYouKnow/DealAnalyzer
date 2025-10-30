// PDF text extraction utility using pdfjs-dist
// Use dynamic import to avoid build-time issues with workers

export async function extractTextFromPDF(file: File | Buffer | ArrayBuffer): Promise<string> {
  try {
    console.log('Starting PDF extraction...');
    
    // Dynamically import pdfjs-dist only when needed (avoid build-time issues)
    console.log('Importing pdfjs-dist...');
    const pdfjsLib = await import('pdfjs-dist');
    console.log('pdfjs-dist imported successfully, version:', pdfjsLib.version);
    
    // Set up the worker for pdfjs-dist (server-side only)
    // Use a CDN worker URL that works in serverless environments
    if (typeof window === 'undefined') {
      const workerUrl = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
      console.log('PDF.js worker configured:', workerUrl);
    }

    let arrayBuffer: ArrayBuffer;
    
    if (file instanceof File) {
      console.log('Converting File to ArrayBuffer, size:', file.size);
      arrayBuffer = await file.arrayBuffer();
      console.log('ArrayBuffer created, byteLength:', arrayBuffer.byteLength);
    } else if (file instanceof Buffer) {
      arrayBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
    } else {
      arrayBuffer = file;
    }

    // Validate array buffer
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('PDF file is empty or invalid');
    }

    // Check PDF magic bytes
    const firstBytes = new Uint8Array(arrayBuffer.slice(0, 4));
    const pdfMagicBytes = [0x25, 0x50, 0x44, 0x46]; // %PDF
    const isPDF = firstBytes[0] === pdfMagicBytes[0] && 
                  firstBytes[1] === pdfMagicBytes[1] && 
                  firstBytes[2] === pdfMagicBytes[2] && 
                  firstBytes[3] === pdfMagicBytes[3];
    
    console.log('PDF magic bytes check:', {
      firstBytes: Array.from(firstBytes),
      isPDF
    });
    
    if (!isPDF) {
      throw new Error('File does not appear to be a valid PDF (missing PDF magic bytes)');
    }

    // Load the PDF document with disableAutoFetch and disableStream for better serverless compatibility
    console.log('Loading PDF document...');
    
    // Try loading without worker first (using legacy build)
    let pdf;
    try {
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        useSystemFonts: true,
        disableAutoFetch: true,
        disableStream: true,
        stopAtErrors: false,
        maxImageSize: 1024 * 1024, // 1MB max image size
        // Try to disable worker if possible (some versions support this)
        verbosity: 0, // Suppress warnings
      });
      
      pdf = await loadingTask.promise;
      console.log('PDF loaded successfully, pages:', pdf.numPages);
    } catch (loadError) {
      console.error('Error loading PDF:', loadError);
      // If worker-related error, try without worker
      if (loadError instanceof Error && (loadError.message.includes('worker') || loadError.message.includes('Worker'))) {
        console.log('Worker error detected, trying fallback method...');
        // Reset worker source and try again
        pdfjsLib.GlobalWorkerOptions.workerSrc = '';
        const loadingTask = pdfjsLib.getDocument({ 
          data: arrayBuffer,
          useSystemFonts: true,
          disableAutoFetch: true,
          disableStream: true,
        });
        pdf = await loadingTask.promise;
        console.log('PDF loaded with fallback method, pages:', pdf.numPages);
      } else {
        throw loadError;
      }
    }

    let fullText = '';

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine all text items from the page
      const pageText = textContent.items
        .map((item: any) => {
          // Handle both string and text-run formats
          if (typeof item.str === 'string') {
            return item.str;
          }
          return '';
        })
        .join(' ');
      
      fullText += pageText + '\n';
    }

    return fullText.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}


// PDF text extraction utility using pdfjs-dist
// Use dynamic import to avoid build-time issues with workers

export async function extractTextFromPDF(file: File | Buffer | ArrayBuffer): Promise<string> {
  try {
    // Dynamically import pdfjs-dist only when needed (avoid build-time issues)
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set up the worker for pdfjs-dist (server-side only)
    // Use a CDN worker URL that works in serverless environments
    if (typeof window === 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }

    let arrayBuffer: ArrayBuffer;
    
    if (file instanceof File) {
      arrayBuffer = await file.arrayBuffer();
    } else if (file instanceof Buffer) {
      arrayBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
    } else {
      arrayBuffer = file;
    }

    // Load the PDF document with disableAutoFetch and disableStream for better serverless compatibility
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useSystemFonts: true,
      disableAutoFetch: true,
      disableStream: true,
    });
    const pdf = await loadingTask.promise;

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


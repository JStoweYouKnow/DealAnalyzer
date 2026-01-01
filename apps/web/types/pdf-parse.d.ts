declare module 'pdf-parse' {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    version: string;
  }

  interface Options {
    pagerender?: (pageData: any) => string;
    max?: number;
  }

  function PDFParse(dataBuffer: Buffer | ArrayBuffer | Uint8Array, options?: Options): Promise<PDFData>;

  export = PDFParse;
}

declare module 'pdf-parse' {
  interface PDFParseResult {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
    text: string;
    textContent?: any;
  }

  function pdfParse(data: Buffer | Uint8Array | string, options?: any): Promise<PDFParseResult>;

  export default pdfParse;
}

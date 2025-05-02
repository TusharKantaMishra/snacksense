declare module 'tesseract.js-node' {
  interface TesseractOptions {
    lang?: string;
    oem?: number;
    psm?: number;
    [key: string]: any;
  }

  interface TesseractResult {
    text: string;
    blocks?: any[];
    confidence?: number;
    [key: string]: any;
  }

  export function recognize(
    image: string | Buffer | Uint8Array,
    options?: TesseractOptions
  ): Promise<TesseractResult>;
}

declare module 'tesseract.js-node' {
  interface TesseractOptions {
    lang?: string;
    oem?: number;
    psm?: number;
    [key: string]: string | number | boolean | undefined;
  }

  interface Block {
    text: string;
    confidence?: number;
    bbox?: { x0: number; y0: number; x1: number; y1: number };
    paragraphs?: { text: string; confidence?: number }[];
    lines?: { text: string; confidence?: number }[];
    words?: { text: string; confidence?: number; bbox?: { x0: number; y0: number; x1: number; y1: number } }[];
  }

  interface TesseractResult {
    text: string;
    blocks?: Block[];
    confidence?: number;
    [key: string]: string | number | Block[] | undefined;
  }

  export function recognize(
    image: string | Buffer | Uint8Array,
    options?: TesseractOptions
  ): Promise<TesseractResult>;
}

declare module 'mammoth' {
  export function extractRawText(options: {
    arrayBuffer: ArrayBuffer;
  }): Promise<{ value: string; messages: any[] }>;

  export function extractRawText(input: { buffer: Buffer }): Promise<{ value: string }>;
} 

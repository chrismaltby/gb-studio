declare module "rgbquant" {
  interface RgbQuantOptions {
    colors?: number; // Number of colors to reduce to
    dithKern?: string; // Dithering kernel
    dithDelta?: number; // Dithering threshold
    dithSerp?: boolean; // Enable serpentine pattern dithering
  }

  class RgbQuant {
    constructor(options?: RgbQuantOptions);

    sample(imageData: Buffer): void; // Sample an image data
    reduce(imageData: Buffer): Uint8Array; // Reduce image data to indexed colors
    palette(): number[][]; // Get the generated palette
  }

  export = RgbQuant;
}

import { readFile } from "fs-extra";
import { PNG } from "pngjs";

/**
 * A data wrapper for an image using indexed colors with one 8-bit value per pixel
 */
export type IndexedImage = {
  width: number;
  height: number;
  data: Uint8Array;
};

/**
 * A color value for use in IndexedImages
 */
enum Color {
  Transparent = 0,
  Light = 1,
  Mid = 2,
  Dark = 3,
  Divider = 254,
  Unknown = 255,
}

/**
 * A function for converting rgb pixel values to an IndexedImage Color
 */
export type ImageIndexFunction = (
  r: number,
  g: number,
  b: number,
  a: number
) => number;

/**
 * A wrapper for a slice of an image giving the sliced data and coordinates where the slice was taken
 */
export type SliceDef = {
  data: IndexedImage;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

/**
 * Load the given PNG image filename into an IndexedImage using the supplied index function.
 *
 * @param filename A local filename which is read using the NodeJS readFile method
 * @param indexFn Function to map an individual RGB pixel value to an 8-bit indexed value
 * @returns A new IndexedImage representing the image data provided
 */
export const readFileToIndexedImage = async (
  filename: string,
  indexFn: ImageIndexFunction
): Promise<IndexedImage> => {
  const fileData = await readFile(filename);
  return new Promise((resolve, reject) => {
    new PNG().parse(fileData, (err, data) => {
      if (err) {
        return reject(err);
      }
      resolve(
        pixelDataToIndexedImage(data.width, data.height, data.data, indexFn)
      );
    });
  });
};

/**
 * Load the given ImageBitmap data into an IndexedImage using the supplied index function.
 *
 * Uses Canvas API and should be run from a browser context. Consider using readFileToIndexedImage instead if calling from Node.
 *
 * @param img ImageBitmap data, can access this using fetch API on a URL e.g. `const img = await fetch(src).then((r) => r.blob())`
 * @param indexFn Function to map an individual RGB pixel value to an 8-bit indexed value
 * @returns A new IndexedImage representing the image data provided
 */
export const imageToIndexedImage = (
  img: ImageBitmap,
  indexFn: ImageIndexFunction
): IndexedImage => {
  const canvas = new OffscreenCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return makeIndexedImage(img.width, img.height);
  }
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return pixelDataToIndexedImage(
    img.width,
    img.height,
    imageData.data,
    indexFn
  );
};

/**
 * Convert an array of pixel data into an IndexedImage using a given index function
 *
 * @param width Image width
 * @param height Image height
 * @param pixels Raw RGB pixel data array
 * @param indexFn A function to convert RGB values to a color index
 * @returns A new IndexedImage representing the pixel data provided
 */
const pixelDataToIndexedImage = (
  width: number,
  height: number,
  pixels: Buffer | Uint8ClampedArray,
  indexFn: ImageIndexFunction
): IndexedImage => {
  const output = makeIndexedImage(width, height);
  let ii = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    output.data[ii] = indexFn(
      pixels[i],
      pixels[i + 1],
      pixels[i + 2],
      pixels[i + 3]
    );
    ii++;
  }
  return output;
};

/**
 * Create a blank IndexedImage with a given width & height
 * @param width Image width
 * @param height Image Height
 * @returns IndexedImage with blank data
 */
export const makeIndexedImage = (
  width: number,
  height: number
): IndexedImage => {
  return {
    width,
    height,
    data: new Uint8Array(width * height),
  };
};

/**
 * Create a deep clone of an IndexedImage
 * @param original An IndexedImage to clone
 * @returns A deep clone of the original IndexedImage
 */
export const cloneIndexedImage = (original: IndexedImage): IndexedImage => {
  return {
    width: original.width,
    height: original.height,
    data: new Uint8Array(original.data),
  };
};

/**
 * Convert an x/y coordinate to an index with an IndexedImage's data
 * @param x X coordinate
 * @param y Y coordinate
 * @param image IndexedImage to read
 * @returns Index value to using in image.data[]
 */
export const toIndex = (x: number, y: number, image: IndexedImage): number =>
  x + y * image.width;

/**
 * Create a new IndexedImage by slicing from a larger image.
 * @param inData IndexedImage to slice
 * @param startX Left coordinate
 * @param startY Top coordinate
 * @param width Width of slice
 * @param height Height of slice
 * @returns
 */
export const sliceIndexedImage = (
  inData: IndexedImage,
  startX: number,
  startY: number,
  width: number,
  height: number
): IndexedImage => {
  const output = makeIndexedImage(width, height);
  const inWidth = inData.width;
  const inHeight = inData.height;

  let ii = 0;
  for (let y = startY; y < startY + height; y++) {
    for (let x = startX; x < startX + width; x++) {
      if (x < inWidth && y < inHeight && x >= 0 && y >= 0) {
        const i = toIndex(x, y, inData);
        output.data[ii] = inData.data[i];
      } else {
        output.data[ii] = Color.Transparent;
      }
      ii++;
    }
  }
  return output;
};

/**
 * Convert an 8px tile to GB 2bpp format
 * @param image Tile image to read (should be 8x8px)
 * @returns Array of GB format 2bpp image data
 */
export const indexedImageTo2bppTileData = (image: IndexedImage): Uint8Array => {
  const output = new Uint8Array(16);
  let i = 0;
  for (let y = 0; y < 8; y++) {
    let row1 = "";
    let row2 = "";
    for (let x = 0; x < 8; x++) {
      const index = toIndex(x, y, image);
      const binary = bin2(image.data[index]);
      row1 += binary[1];
      row2 += binary[0];
    }
    output[i] = binDec(row1);
    i++;
    output[i] = binDec(row2);
    i++;
  }

  return output;
};

/**
 * Flip IndexedImage horizontally
 * @param inData Image to flip
 * @returns Horizontally flipped IndexedImage
 */
export const flipIndexedImageX = (inData: IndexedImage): IndexedImage => {
  const output = makeIndexedImage(inData.width, inData.height);
  const width = inData.width;
  const height = inData.height;
  let ii = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = toIndex(width - x - 1, y, inData);
      output.data[ii] = inData.data[i];
      ii++;
    }
  }
  return output;
};

/**
 * Flip IndexedImage vertically
 * @param inData Image to flip
 * @returns Vertically flipped IndexedImage
 */
export const flipIndexedImageY = (inData: IndexedImage): IndexedImage => {
  const output = makeIndexedImage(inData.width, inData.height);
  const width = inData.width;
  const height = inData.height;
  let ii = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = toIndex(x, height - y - 1, inData);
      output.data[ii] = inData.data[i];
      ii++;
    }
  }
  return output;
};

export const trimIndexedImage = (
  inData: IndexedImage,
  trimValue: number
): SliceDef => {
  const width = inData.width;
  const height = inData.height;
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = toIndex(x, y, inData);
      if (inData.data[i] !== trimValue) {
        if (x < minX) {
          minX = x;
        }
        if (x > maxX) {
          maxX = x;
        }
        if (y < minY) {
          minY = y;
        }
        if (y > maxY) {
          maxY = y;
        }
      }
    }
  }
  const sliceW = Math.max(0, maxX - minX + 1);
  const sliceH = Math.max(0, maxY - minY + 1);
  return {
    data: sliceIndexedImage(inData, minX, minY, sliceW, sliceH),
    coordinates: { x: minX, y: minY, width: sliceW, height: sliceH },
  };
};

export const trimIndexedImageHorizontal = (
  inData: IndexedImage,
  trimValue: number
): SliceDef => {
  const width = inData.width;
  const height = inData.height;
  let minX = width;
  let maxX = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = toIndex(x, y, inData);
      if (inData.data[i] !== trimValue) {
        if (x < minX) {
          minX = x;
        }
        if (x > maxX) {
          maxX = x;
        }
      }
    }
  }
  const sliceW = Math.max(0, maxX - minX + 1);
  const sliceH = inData.height;
  return {
    data: sliceIndexedImage(inData, minX, 0, sliceW, sliceH),
    coordinates: { x: minX, y: 0, width: sliceW, height: sliceH },
  };
};

const bin2 = (value: Color) => value.toString(2).padStart(2, "0");
const binDec = (binary: string) => parseInt(binary, 2);

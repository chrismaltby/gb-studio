import {
  ImageIndexFunction,
  IndexedImage,
  makeIndexedImage,
  pixelDataToIndexedImage,
} from "shared/lib/tiles/indexedImage";

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
  indexFn: ImageIndexFunction,
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
    indexFn,
  );
};

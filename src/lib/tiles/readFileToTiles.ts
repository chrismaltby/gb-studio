import { TILE_SIZE } from "consts";
import { readFile } from "fs-extra";
import { PNG } from "pngjs";
import {
  ImageIndexFunction,
  IndexedImage,
  indexedImageTo2bppTileData,
  pixelDataToIndexedImage,
  sliceIndexedImage,
} from "shared/lib/tiles/indexedImage";
import { tileDataIndexFn } from "shared/lib/tiles/tileData";

/**
 * Load the given PNG image filename into an IndexedImage using the supplied index function.
 *
 * @param filename A local filename which is read using the NodeJS readFile method
 * @param indexFn Function to map an individual RGB pixel value to an 8-bit indexed value
 * @returns A new IndexedImage representing the image data provided
 */
export const readFileToIndexedImage = async (
  filename: string,
  indexFn: ImageIndexFunction,
): Promise<IndexedImage> => {
  const fileData = await readFile(filename);
  return new Promise((resolve, reject) => {
    new PNG().parse(fileData, (err, data) => {
      if (err) {
        return reject(err);
      }
      resolve(
        pixelDataToIndexedImage(data.width, data.height, data.data, indexFn),
      );
    });
  });
};

/**
 * Read an image filename into a GB 2bpp data array
 * @param filename Tiles image filename
 * @returns Uint8Array of 2bpp tile data
 */
export const readFileToTilesData = async (
  filename: string,
): Promise<Uint8Array> => {
  const img = await readFileToIndexedImage(filename, tileDataIndexFn);
  const xTiles = Math.floor(img.width / TILE_SIZE);
  const yTiles = Math.floor(img.height / TILE_SIZE);
  const size = xTiles * yTiles * 16;
  const output = new Uint8Array(size);
  let index = 0;
  for (let tyi = 0; tyi < yTiles; tyi++) {
    for (let txi = 0; txi < xTiles; txi++) {
      const tileData = indexedImageTo2bppTileData(
        sliceIndexedImage(
          img,
          txi * TILE_SIZE,
          tyi * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE,
        ),
      );
      output.set(tileData, index);
      index += tileData.length;
    }
  }
  return output;
};

/**
 * Read an image filename into an array of GB 2bpp data array (one array per tile)
 * @param filename Tiles image filename
 * @returns Array of Uint8Array of 2bpp tile data
 */
export const readFileToTilesDataArray = async (
  filename: string,
): Promise<Uint8Array[]> => {
  const img = await readFileToIndexedImage(filename, tileDataIndexFn);
  const xTiles = Math.floor(img.width / TILE_SIZE);
  const yTiles = Math.floor(img.height / TILE_SIZE);
  const output = [];
  for (let tyi = 0; tyi < yTiles; tyi++) {
    for (let txi = 0; txi < xTiles; txi++) {
      const tileData = indexedImageTo2bppTileData(
        sliceIndexedImage(
          img,
          txi * TILE_SIZE,
          tyi * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE,
        ),
      );
      output.push(tileData);
    }
  }
  return output;
};

/**
 * Convert an indexed image into an array of GB 2bpp data array (one array per tile)
 * @param filename Tiles image filename
 * @returns Array of Uint8Array of 2bpp tile data
 */
export const indexedImageToTilesDataArray = (
  img: IndexedImage,
): Uint8Array[] => {
  const xTiles = Math.floor(img.width / TILE_SIZE);
  const yTiles = Math.floor(img.height / TILE_SIZE);
  const output = [];
  for (let tyi = 0; tyi < yTiles; tyi++) {
    for (let txi = 0; txi < xTiles; txi++) {
      const tileData = indexedImageTo2bppTileData(
        sliceIndexedImage(
          img,
          txi * TILE_SIZE,
          tyi * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE,
        ),
      );
      output.push(tileData);
    }
  }
  return output;
};

import chroma from "chroma-js";
import { TILE_SIZE } from "consts";
import { IndexedImage } from "shared/lib/tiles/indexedImage";
import { rgbToColorCorrectedHex } from "shared/lib/color/colorCorrection";
import { ColorCorrectionSetting } from "shared/lib/resources/types";
import { rgb2hex } from "shared/lib/helpers/color";

type VariableLengthHexPalette = string[];

type SparseHexPalette = [
  string | undefined,
  string | undefined,
  string | undefined,
  string | undefined,
];

type HexPalette = [string, string, string, string];

export type AutoPaletteResult = {
  map: number[];
  palettes: HexPalette[];
  indexedImage: IndexedImage;
};

/**
 * Given raw RGBA pixel data construct:
 * + an array of GBC compatible color palettes
 * + DMG tile data
 * + an attr map from tile index to color palette
 */
export const autoPalette = (
  width: number,
  height: number,
  pixels: Buffer | Uint8ClampedArray,
  colorCorrection: ColorCorrectionSetting,
): AutoPaletteResult => {
  const xTiles = Math.floor(width / TILE_SIZE);
  const yTiles = Math.floor(height / TILE_SIZE);
  const paletteCache: Record<string, number> = {};
  const allPalettes: VariableLengthHexPalette[] = [];
  const tilePaletteMap: number[] = [];
  const recolorCache: Record<string, string> = {};
  const indexedImage = {
    width,
    height,
    data: new Uint8Array(width * height),
  };

  // Loop each tile to extract palette used and build
  // mapping table from tile to palette
  // Keep cache of tile rgb data to hex palette so don't
  // evaluate identical tile data multiple times
  const tilePaletteCache: Record<string, VariableLengthHexPalette> = {};
  for (let tyi = 0; tyi < yTiles; tyi++) {
    for (let txi = 0; txi < xTiles; txi++) {
      const ti = tyi * xTiles + txi;
      const tileKey = tileToCacheKey(pixels, width, txi, tyi);
      let palette = tilePaletteCache[tileKey];
      if (!palette) {
        palette = extractTilePalette(pixels, width, txi, tyi, colorCorrection);
        tilePaletteCache[tileKey] = palette;
      }
      const key = palette.join("");
      if (paletteCache[key]) {
        tilePaletteMap[ti] = paletteCache[key];
      } else {
        tilePaletteMap[ti] = allPalettes.length;
        paletteCache[key] = tilePaletteMap[ti];
        allPalettes.push(palette);
      }
    }
  }

  // As some tiles may overlap it's possible to compress them further
  // mapping table maps original palette index to indexed in compressed list
  const { palettes, mappingTable } = compressPalettes(allPalettes);

  // Given the extracted colors we can now build the tile data
  // and the mapping of tiles to color palette
  for (let tyi = 0; tyi < yTiles; tyi++) {
    for (let txi = 0; txi < xTiles; txi++) {
      const ti = tyi * xTiles + txi;
      tilePaletteMap[ti] = mappingTable[tilePaletteMap[ti]];
      buildIndexedTile(
        pixels,
        width,
        txi,
        tyi,
        tilePaletteMap[ti],
        palettes[tilePaletteMap[ti]],
        recolorCache,
        indexedImage,
      );
    }
  }

  return {
    map: tilePaletteMap,
    palettes: fillHexPalette(palettes),
    indexedImage,
  };
};

/**
 * Given raw RGBA pixel data and DMG indexed image construct:
 * + an array of GBC compatible color palettes
 * + an attr map from tile index to color palette
 */
export const autoPaletteUsingTiles = (
  width: number,
  height: number,
  pixels: Buffer | Uint8ClampedArray,
  tileData: IndexedImage,
  colorCorrection: ColorCorrectionSetting,
): AutoPaletteResult => {
  const xTiles = Math.floor(width / TILE_SIZE);
  const yTiles = Math.floor(height / TILE_SIZE);
  const paletteCache: Record<string, number> = {};
  const allPalettes: SparseHexPalette[] = [];
  const tilePaletteMap: number[] = [];

  // Loop each tile to extract palette used and build
  // mapping table from tile to palette
  // using the DMG tile data as a hint for color mapping
  for (let tyi = 0; tyi < yTiles; tyi++) {
    for (let txi = 0; txi < xTiles; txi++) {
      const ti = tyi * xTiles + txi;
      const palette = extractTilePaletteWithHint(
        pixels,
        width,
        txi,
        tyi,
        tileData,
        colorCorrection,
      );
      const key = JSON.stringify(palette);
      if (paletteCache[key]) {
        tilePaletteMap[ti] = paletteCache[key];
      } else {
        tilePaletteMap[ti] = allPalettes.length;
        paletteCache[key] = tilePaletteMap[ti];
        allPalettes.push(palette);
      }
    }
  }

  // As some tiles may overlap it's possible to compress them further
  // mapping table maps original palette index to indexed in compressed list
  const { palettes, mappingTable } = compressSparsePalettes(allPalettes);

  // Build mapping of tiles to color palette
  for (let tyi = 0; tyi < yTiles; tyi++) {
    for (let txi = 0; txi < xTiles; txi++) {
      const ti = tyi * xTiles + txi;
      tilePaletteMap[ti] = mappingTable[tilePaletteMap[ti]];
    }
  }

  return {
    map: tilePaletteMap,
    palettes: fillHexPalette(palettes),
    indexedImage: tileData,
  };
};

/**
 * Build a cache key for a given tile's pixel data
 */
const tileToCacheKey = (
  pixels: Buffer | Uint8ClampedArray,
  width: number,
  tileX: number,
  tileY: number,
): string => {
  const startX = tileX * TILE_SIZE;
  const endX = (tileX + 1) * TILE_SIZE;
  const startY = tileY * TILE_SIZE;
  const endY = (tileY + 1) * TILE_SIZE;
  const values: number[] = [];
  for (let yi = startY; yi < endY; yi++) {
    for (let xi = startX; xi < endX; xi++) {
      const i = (yi * width + xi) * 4;
      values.push(pixels[i]);
      values.push(pixels[i + 1]);
      values.push(pixels[i + 2]);
    }
  }
  return values.join();
};

/**
 * For a given tile color data extract the first four colors found sorted by perceptual lightness
 */
const extractTilePalette = (
  pixels: Buffer | Uint8ClampedArray,
  width: number,
  tileX: number,
  tileY: number,
  colorCorrection: ColorCorrectionSetting,
): VariableLengthHexPalette => {
  const startX = tileX * TILE_SIZE;
  const endX = (tileX + 1) * TILE_SIZE;
  const startY = tileY * TILE_SIZE;
  const endY = (tileY + 1) * TILE_SIZE;
  const seenColorLookup: Record<string, boolean> = {};
  const colors: VariableLengthHexPalette = [];
  for (let yi = startY; yi < endY; yi++) {
    for (let xi = startX; xi < endX; xi++) {
      const i = (yi * width + xi) * 4;
      const key = `${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`;
      if (!seenColorLookup[key]) {
        seenColorLookup[key] = true;
        const colorCorrectionFn =
          colorCorrection === "default" ? rgbToColorCorrectedHex : rgb2hex;
        const hex = colorCorrectionFn(pixels[i], pixels[i + 1], pixels[i + 2]);
        colors.push(hex);
        if (colors.length === 4) {
          return sortHexPalette(colors);
        }
      }
    }
  }
  return sortHexPalette(colors);
};

/**
 * For a given tile color data and DMG tile hint extract a sparse palette mapping from DMG index to color
 */
export const extractTilePaletteWithHint = (
  pixels: Buffer | Uint8ClampedArray,
  width: number,
  tileX: number,
  tileY: number,
  indexedImage: IndexedImage,
  colorCorrection: ColorCorrectionSetting,
): SparseHexPalette => {
  const startX = tileX * TILE_SIZE;
  const endX = (tileX + 1) * TILE_SIZE;
  const startY = tileY * TILE_SIZE;
  const endY = (tileY + 1) * TILE_SIZE;
  const seenColorLookup: Record<string, boolean> = {};
  const colors: SparseHexPalette = [undefined, undefined, undefined, undefined];
  let seenCount = 0;
  for (let yi = startY; yi < endY; yi++) {
    for (let xi = startX; xi < endX; xi++) {
      const ii = yi * width + xi;
      const i = ii * 4;
      const index = indexedImage.data[ii];
      if (colors[index]) {
        continue;
      }
      const key = `${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`;
      if (!seenColorLookup[key]) {
        seenColorLookup[key] = true;
        const colorCorrectionFn =
          colorCorrection === "default" ? rgbToColorCorrectedHex : rgb2hex;
        const hex = colorCorrectionFn(pixels[i], pixels[i + 1], pixels[i + 2]);
        colors[index] = hex;
        seenCount++;
        if (seenCount === 4) {
          return colors;
        }
      }
    }
  }
  return colors;
};

/**
 * Sort palette by perceptual lightness
 */
const sortHexPalette = (
  input: VariableLengthHexPalette,
): VariableLengthHexPalette => {
  return input
    .map((hex) => ({ hex, lightness: chroma(hex).lab()[0] }))
    .sort(sortLightnessProp)
    .map(({ hex }) => hex);
};

/**
 * Given a palette for a selected tile build DMG indexed tile data
 * by finding closest palette color for each pixel in tile
 */
const buildIndexedTile = (
  pixels: Buffer | Uint8ClampedArray,
  width: number,
  tileX: number,
  tileY: number,
  paletteIndex: number,
  palette: VariableLengthHexPalette,
  recolorCache: Record<string, string>,
  indexedImage: IndexedImage,
): void => {
  const startX = tileX * TILE_SIZE;
  const endX = (tileX + 1) * TILE_SIZE;
  const startY = tileY * TILE_SIZE;
  const endY = (tileY + 1) * TILE_SIZE;
  const indexCache: Record<string, number> = {};
  for (let yi = startY; yi < endY; yi++) {
    for (let xi = startX; xi < endX; xi++) {
      const ii = yi * width + xi;
      const i = ii * 4;
      // Cache key for this RGB + Palette index combination
      const key = `${paletteIndex}:${pixels[i]},${pixels[i + 1]},${
        pixels[i + 2]
      }`;
      // Check local cache for RGB to index value
      if (!indexCache[key]) {
        // Otherwise check image wide cache for palette + RGB to closest hex
        if (!recolorCache[key]) {
          recolorCache[key] = findClosestHexColor(
            rgbToColorCorrectedHex(pixels[i], pixels[i + 1], pixels[i + 2]),
            palette,
          );
        }
        const color = recolorCache[key];
        const index = palette.indexOf(color);
        indexCache[key] = index;
      }
      indexedImage.data[ii] = indexCache[key];
    }
  }
};

/**
 * Calculate quick rough distance between two hex colors
 */
const manhattanHexDistance = (color1: string, color2: string): number => {
  const r1 = parseInt(color1.substring(0, 2), 16);
  const g1 = parseInt(color1.substring(2, 4), 16);
  const b1 = parseInt(color1.substring(4, 6), 16);
  const r2 = parseInt(color2.substring(0, 2), 16);
  const g2 = parseInt(color2.substring(2, 4), 16);
  const b2 = parseInt(color2.substring(4, 6), 16);
  return Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
};

/**
 * Given a calculated palette find the closest match to a given hex color
 */
const findClosestHexColor = (
  color: string,
  palette: VariableLengthHexPalette,
): string => {
  let closestColor = palette[0];
  let minDistance = Infinity;
  for (const paletteColor of palette) {
    const distance = manhattanHexDistance(color, paletteColor);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = paletteColor;
    }
  }
  return closestColor;
};

/**
 * Compress array of hex palettes by merging overlapping palettes
 * builds a mapping table from old palette to new index
 */
const compressPalettes = (allPalettes: VariableLengthHexPalette[]) => {
  // Early exit if 8 or fewer palettes are provided
  if (allPalettes.length <= 8) {
    const mappingTable = allPalettes.map((_, index) => index);
    return { palettes: allPalettes, mappingTable };
  }

  let outPalettes = [...allPalettes];
  // let labPalettes = allPalettes.map((palette) => palette.map((hex) => ({hex, chroma:chroma(hex)})));
  const originIndices: number[][] = allPalettes.map((_, index) => [index]); // Tracks original indices for each new palette

  // Sort with largest palettes first before merging
  // Need to tests to see if this is needed
  // If it is needs a mapping table update
  //   labPalettes = labPalettes.sort((a, b) => b.length - a.length);

  // Merge overlapping palettes
  let merged = true;
  while (merged) {
    merged = false;
    for (let i = 0; i < outPalettes.length; i++) {
      for (let j = i + 1; j < outPalettes.length; j++) {
        const combined = [...outPalettes[i], ...outPalettes[j]];
        const uniqueColors = new Set(combined);
        if (uniqueColors.size <= 4) {
          outPalettes[i] = Array.from(uniqueColors);
          originIndices[i] = [...originIndices[i], ...originIndices[j]]; // Merge origin indices
          outPalettes.splice(j, 1);
          originIndices.splice(j, 1); // Remove the merged palette's origin indices
          merged = true;
          break;
        }
      }
      if (merged) break;
    }
  }

  // Sort palettes by lightness
  outPalettes = outPalettes.map(sortHexPalette);

  // Generate mapping table
  const mappingTable = new Array(allPalettes.length)
    .fill(0)
    .map((a, i) => i % 8);
  originIndices.forEach((origins, newIndex) => {
    origins.forEach((origin) => {
      mappingTable[origin] = newIndex % 8;
    });
  });

  return { palettes: outPalettes, mappingTable };
};

/**
 * Sort function comparing two Chroma Colors in LAB space by perceptual lightness
 */
const sortLightnessProp = <T extends { lightness: number }>(a: T, b: T) =>
  b.lightness - a.lightness;

/**
 * Determine if two sparse palettes contain enough overlap to be mergable
 */
const canMergeSparsePalette = (
  palette1: SparseHexPalette,
  palette2: SparseHexPalette,
): boolean => {
  // Check every color in both palettes is able to merge
  return palette1.every((color1, index) => {
    const color2 = palette2[index];
    // Can merge empty spaces
    if (color1 === undefined || color2 === undefined) {
      return true;
    }
    // Or can merge if colors at index are identical
    return color1 === color2;
  });
};

/**
 * Combine two sparse RGB palettes to include all colors from both palettes
 * must confirm palettes are able to be merged with canMergeSparsePalette() first
 */
const mergeSparsePalette = (
  palette1: SparseHexPalette,
  palette2: SparseHexPalette,
): SparseHexPalette => {
  const merged: SparseHexPalette = [undefined, undefined, undefined, undefined];
  for (let i = 0; i < 4; i++) {
    merged[i] = palette1[i] !== undefined ? palette1[i] : palette2[i];
  }
  return merged;
};

/**
 * Compress array of sparse palettes by merging overlapping palettes
 * builds a mapping table from old palette to new index
 */
const compressSparsePalettes = (allPalettes: SparseHexPalette[]) => {
  const indexedPalettes = allPalettes.map((palette, index) => ({
    palette,
    index,
    numDefined: palette.reduce((memo, color) => memo + (color ? 1 : 0), 0),
  }));

  // Sort indexed palettes by the number of defined colors, descending
  // to reduce fragmentation of palettes
  indexedPalettes.sort((a, b) => b.numDefined - a.numDefined);

  const palettes: SparseHexPalette[] = [];
  const mappingTable: number[] = Array(allPalettes.length).fill(-1);

  // Merge overlapping palettes and build mapping table
  indexedPalettes.forEach(({ palette, index }) => {
    let merged = false;
    for (let i = 0; i < palettes.length; i++) {
      if (canMergeSparsePalette(palettes[i], palette)) {
        palettes[i] = mergeSparsePalette(palettes[i], palette);
        mappingTable[index] = i;
        merged = true;
        break;
      }
    }
    if (!merged) {
      palettes.push(palette);
      mappingTable[index] = palettes.length - 1;
    }
  });

  return { palettes, mappingTable };
};

/**
 * Given an array of hex palettes
 * fill them so each contains four values
 */
const fillHexPalette = (
  palettes: Array<VariableLengthHexPalette | SparseHexPalette>,
): HexPalette[] => {
  return palettes.map((palette) => {
    return [
      palette[0] ?? "000000",
      palette[1] ?? "000000",
      palette[2] ?? "000000",
      palette[3] ?? "000000",
    ];
  });
};

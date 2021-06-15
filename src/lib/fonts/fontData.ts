import Path from "path";
import { readJson } from "fs-extra";
import {
  ImageIndexFunction,
  IndexedImage,
  indexedImageTo2bppTileData,
  readFileToIndexedImage,
  sliceIndexedImage,
  trimIndexedImageHorizontal,
} from "../tiles/indexedImage";

export interface FontData {
  name: string;
  table: number[];
  widths: number[];
  data: Uint8Array;
  isVariableWidth: boolean;
  is1Bit: boolean;
  mapping: Record<string, number>;
}

interface CharacterData {
  width: number;
  data: IndexedImage;
}

type CharLookup = Record<string, CharacterData>;

enum Color {
  White = 0,
  Light = 1,
  Mid = 2,
  Dark = 3,
  Transparent = 255,
}

const TILE_SIZE = 8;
const FIRST_CHAR = 32;

export const readFileToFontData = async (
  filename: string
): Promise<FontData> => {
  const name = Path.basename(filename);
  const image = await readFileToIndexedImage(filename, fontDataIndexFn);
  const tileWidth = Math.floor(image.width / TILE_SIZE);
  const tileHeight = Math.floor(image.height / TILE_SIZE);
  const chars: CharacterData[] = [];
  let is1Bit = true;
  let isVariableWidth = false;

  const metadataFilename = filename.replace(/\.png$/i, ".json");
  let mapping: Record<string, number> = {};
  try {
    const metadataFile = await readJson(metadataFilename);
    if (
      typeof metadataFile === "object" &&
      metadataFile.mapping &&
      typeof metadataFile.mapping === "object"
    ) {
      mapping = metadataFile.mapping;
    }
  } catch (e) {}

  // Determine if font is only using white & black pixels
  for (let i = 0; i < image.data.length; i++) {
    if (image.data[i] === Color.Light || image.data[i] === Color.Mid) {
      is1Bit = false;
      break;
    }
  }

  // Build tile list
  for (let ty = 0; ty < tileHeight; ty++) {
    for (let tx = 0; tx < tileWidth; tx++) {
      const tile = sliceIndexedImage(
        image,
        tx * TILE_SIZE,
        ty * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE
      );
      const trimmedTile = trimIndexedImageHorizontal(tile, Color.Transparent);

      if (trimmedTile.data.width < TILE_SIZE) {
        isVariableWidth = true;
      }

      chars.push({
        width: trimmedTile.data.width,
        data: sliceIndexedImage(trimmedTile.data, 0, 0, TILE_SIZE, TILE_SIZE),
      });
    }
  }

  // Build unique tiles list
  const uniqueTilesLookup: CharLookup = {};
  const charKeys: string[] = [];
  for (const char of chars) {
    const key = hashChar(char.data);
    if (!uniqueTilesLookup[key]) {
      uniqueTilesLookup[key] = char;
    }
    charKeys.push(key);
  }
  const uniqueTileKeys = Object.keys(uniqueTilesLookup);
  const uniqueTiles = Object.values(uniqueTilesLookup);

  // Construct output data
  const table = (Array.from(Array(FIRST_CHAR)) as number[])
    .fill(0)
    .concat(charKeys.map((key) => uniqueTileKeys.indexOf(key)));
  const widths = uniqueTiles.map((tile) => tile.width);
  const data = charLookupToTileData(uniqueTilesLookup);

  return {
    name,
    table,
    widths,
    data,
    isVariableWidth,
    is1Bit,
    mapping,
  };
};

export const fontDataIndexFn: ImageIndexFunction = (r, g, b, _a) => {
  if (g > 249 || (r > 249 && b > 249)) {
    return Color.Transparent;
  }
  if (g < 65) {
    return Color.Dark;
  }
  if (g < 130) {
    return Color.Mid;
  }
  if (g < 205) {
    return Color.Light;
  }
  return Color.White;
};

export const charLookupToTileData = (lookup: CharLookup): Uint8Array => {
  const chars = Object.values(lookup);
  const charsData = chars.map((char) => indexedImageTo2bppTileData(char.data));
  const size = charsData.reduce((memo, char) => memo + char.length, 0);
  const output = new Uint8Array(size);
  let index = 0;
  for (const charData of charsData) {
    output.set(charData, index);
    index += charData.length;
  }
  return output;
};

const hashChar = (char: IndexedImage): string => {
  // Will do for now...
  return JSON.stringify(char.data);
};

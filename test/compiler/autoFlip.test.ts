import {
  TILE_COLOR_PROP_FLIP_HORIZONTAL as FLIP_H,
  TILE_COLOR_PROP_FLIP_VERTICAL as FLIP_V,
  TILE_COLOR_PROP_PRIORITY as PRIORITY,
} from "consts";
import {
  readFileToIndexedImage,
  readFileToTilesDataArray,
} from "lib/tiles/readFileToTiles";
import { autoFlipTiles } from "shared/lib/tiles/autoFlip";
import { tileDataIndexFn, toTileLookup } from "shared/lib/tiles/tileData";

const buildImageData = async (
  filename: string,
  tileColors: number[],
  commonTileData: Uint8Array[],
) => {
  const indexedImage = await readFileToIndexedImage(filename, tileDataIndexFn);
  const { tileData, tileAttrs, tilesetData } = autoFlipTiles({
    indexedImage,
    tileColors,
    commonTileData,
  });
  const tilesetLookup = toTileLookup(tilesetData) ?? {};
  const uniqueTiles = Object.values(tilesetLookup);
  return {
    tileData,
    tileAttrs,
    tilesetData,
    uniqueTiles,
  };
};

test("Should auto flip tiles to create optimised tileset", async () => {
  const filename = `${__dirname}/_files/test/autoflip1.png`;
  const { tileData, tileAttrs, uniqueTiles } = await buildImageData(
    filename,
    [],
    [],
  );
  expect(tileData.length).toBe(360);
  expect(uniqueTiles.length).toBe(4);
  expect(tileAttrs[0]).toBe(0);
  expect(tileAttrs[1]).toBe(FLIP_H);
  expect(tileAttrs[2]).toBe(FLIP_V);
  expect(tileAttrs[3]).toBe(0);
  expect(tileAttrs[4]).toBe(0);
  expect(tileAttrs[5]).toBe(FLIP_H | FLIP_V);
  expect(tileAttrs[6]).toBe(FLIP_V);
  expect(tileAttrs[7]).toBe(0);
});

test("Should keep tile palette data when flipping", async () => {
  const filename = `${__dirname}/_files/test/autoflip1.png`;
  const { tileData, tileAttrs, uniqueTiles } = await buildImageData(
    filename,
    [0, 1, 2, 3, 4, 5, 6, 7],
    [],
  );
  expect(tileData.length).toBe(360);
  expect(uniqueTiles.length).toBe(4);
  expect(tileAttrs[0]).toBe(0);
  expect(tileAttrs[1]).toBe(1 | FLIP_H);
  expect(tileAttrs[2]).toBe(2 | FLIP_V);
  expect(tileAttrs[3]).toBe(3);
  expect(tileAttrs[4]).toBe(4);
  expect(tileAttrs[5]).toBe(5 | FLIP_H | FLIP_V);
  expect(tileAttrs[6]).toBe(6 | FLIP_V);
  expect(tileAttrs[7]).toBe(7);
});

test("Should keep tile priority data when flipping", async () => {
  const filename = `${__dirname}/_files/test/autoflip1.png`;
  const { tileData, tileAttrs, uniqueTiles } = await buildImageData(
    filename,
    [PRIORITY, 0, PRIORITY, 0, PRIORITY, 0, PRIORITY, 0],
    [],
  );
  expect(tileData.length).toBe(360);
  expect(uniqueTiles.length).toBe(4);
  expect(tileAttrs[0]).toBe(PRIORITY);
  expect(tileAttrs[1]).toBe(FLIP_H);
  expect(tileAttrs[2]).toBe(PRIORITY | FLIP_V);
  expect(tileAttrs[3]).toBe(0);
  expect(tileAttrs[4]).toBe(PRIORITY);
  expect(tileAttrs[5]).toBe(FLIP_H | FLIP_V);
  expect(tileAttrs[6]).toBe(PRIORITY | FLIP_V);
  expect(tileAttrs[7]).toBe(0);
});

test("Should prioritise common tiles when flipping", async () => {
  const filename = `${__dirname}/_files/test/autoflip1.png`;
  const commonFilename = `${__dirname}/_files/test/autoflip1_common.png`;
  const commonTileData = await readFileToTilesDataArray(commonFilename);
  const { tileData, tileAttrs, uniqueTiles } = await buildImageData(
    filename,
    [],
    commonTileData,
  );
  expect(tileData.length).toBe(360);
  expect(uniqueTiles.length).toBe(5);
  expect(tileAttrs[0]).toBe(0);
  expect(tileAttrs[1]).toBe(FLIP_H);
  expect(tileAttrs[2]).toBe(FLIP_V);
  expect(tileAttrs[3]).toBe(0);
  expect(tileAttrs[4]).toBe(0);
  expect(tileAttrs[5]).toBe(FLIP_H | FLIP_V);
  expect(tileAttrs[6]).toBe(0);
  expect(tileAttrs[7]).toBe(0);
});

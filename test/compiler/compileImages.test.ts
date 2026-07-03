import compileImages from "lib/compiler/compileImages";
import { readFileToTilesDataArray } from "lib/tiles/readFileToTiles";
import { ReferencedBackground } from "lib/compiler/precompile/determineUsedAssets";
import { tileArrayToTileData } from "shared/lib/tiles/tileData";

const BYTES_PER_TILE = 16;

test("should compile images", async () => {
  const backgroundData = [
    {
      id: "img1",
      filename: "boss.png",
    },
  ] as ReferencedBackground[];
  const res = await compileImages(
    backgroundData,
    {},
    "default",
    true,
    `${__dirname}/_files/`,
    { warnings: () => {} },
  );
  expect(res[0]?.tilemap.length).toEqual(360);
  expect(res[0]?.vramData[0].length).toEqual(114 * BYTES_PER_TILE);
});

test("should crop oversized logo images to the top-left 20x18 tiles", async () => {
  const sourceWidth = 56;
  const sourceHeight = 56;
  const tileColors = Array.from(
    { length: sourceWidth * sourceHeight },
    (_, index) => index % 8,
  );
  const backgroundData = [
    {
      id: "logo",
      filename: "scribble.png",
      imageWidth: sourceWidth * 8,
      imageHeight: sourceHeight * 8,
      tileColors,
      is360: true,
      colorMode: "mono",
    },
  ] as ReferencedBackground[];

  const [result] = await compileImages(
    backgroundData,
    {},
    "default",
    false,
    `${__dirname}/_files/`,
    { warnings: () => {} },
  );
  const sourceTiles = await readFileToTilesDataArray(
    `${__dirname}/_files/assets/backgrounds/scribble.png`,
  );
  const expectedTiles = Array.from({ length: 20 * 18 }, (_, index) => {
    const x = index % 20;
    const y = Math.floor(index / 20);
    return sourceTiles[y * sourceWidth + x] ?? new Uint8Array(16);
  });
  const expectedAttrs = Array.from({ length: 20 * 18 }, (_, index) => {
    const x = index % 20;
    const y = Math.floor(index / 20);
    return tileColors[y * sourceWidth + x];
  });

  expect(result?.vramData[0]).toEqual([
    ...tileArrayToTileData(expectedTiles),
  ]);
  expect(result?.attr).toEqual(expectedAttrs);
  expect(result?.tilemap).toEqual(
    Array.from({ length: 20 * 18 }, (_, index) => index),
  );
});

test("should compile split large images into two tilesets for CGB mode", async () => {
  const backgroundData = [
    {
      id: "img1",
      filename: "scribble.png",
      colorMode: "color",
      tileColors: [],
    },
  ] as unknown as ReferencedBackground[];
  const res = await compileImages(
    backgroundData,
    {},
    "default",
    false,
    `${__dirname}/_files/`,
    { warnings: () => {} },
  );
  expect(res[0]?.tilemap.length).toEqual(3136);
  expect(res[0]?.vramData[0].length).toEqual(192 * BYTES_PER_TILE);
  expect(res[0]?.vramData[1].length).toEqual(192 * BYTES_PER_TILE);
});

test("should compile large images into one overflowing bank when not in color only mode", async () => {
  const backgroundData = [
    {
      id: "img1",
      filename: "scribble.png",
    },
  ] as ReferencedBackground[];
  const res = await compileImages(
    backgroundData,
    {},
    "default",
    true,
    `${__dirname}/_files/`,
    { warnings: () => {} },
  );
  expect(res[0]?.tilemap.length).toEqual(3136);
  expect(res[0]?.vramData[0].length).toEqual(384 * BYTES_PER_TILE);
});

test("should split tiles into two banks when in color only mode, filling first 128 tiles of vram bank 1 first", async () => {
  const backgroundData = [
    {
      id: "img1",
      filename: "parallax.png",
      colorMode: "color",
      tileColors: [],
    },
  ] as unknown as ReferencedBackground[];
  const res = await compileImages(
    backgroundData,
    {},
    "default",
    true,
    `${__dirname}/_files/`,
    { warnings: () => {} },
  );
  expect(res[0]?.tilemap.length).toEqual(1440);
  expect(res[0]?.vramData[0].length).toEqual(128 * BYTES_PER_TILE);
  expect(res[0]?.vramData[1].length).toEqual(63 * BYTES_PER_TILE);
});

test("should handle overflow correctly for DMG mode", async () => {
  const backgroundData = [
    {
      id: "img1",
      filename: "tiles-194.png",
      colorMode: "mono",
    },
  ] as ReferencedBackground[];
  const res = await compileImages(
    backgroundData,
    {},
    "default",
    true,
    `${__dirname}/_files/`,
    { warnings: () => {} },
  );
  expect(res[0]?.tilemap.length).toEqual(360);
  expect(res[0]?.vramData[0].length).toEqual(194 * BYTES_PER_TILE);
  expect(res[0]?.vramData[1].length).toEqual(0);
  for (let i = 0; i <= 0xc1; i++) {
    expect(res[0]?.tilemap[i]).toEqual(i);
  }
  for (let i = 0xc1; i < (res[0]?.tilemap?.length ?? 0); i++) {
    expect(res[0]?.tilemap[i]).toEqual(0xc1);
  }
});

test("should handle overflow correctly for color only mode", async () => {
  const backgroundData = [
    {
      id: "img1",
      filename: "tiles-386.png",
      colorMode: "color",
      tileColors: [],
    },
  ] as unknown as ReferencedBackground[];
  const res = await compileImages(
    backgroundData,
    {},
    "default",
    false,
    `${__dirname}/_files/`,
    { warnings: () => {} },
  );
  expect(res[0]?.tilemap.length).toEqual(640);
  expect(res[0]?.vramData[0].length).toEqual(193 * BYTES_PER_TILE);
  expect(res[0]?.vramData[1].length).toEqual(193 * BYTES_PER_TILE);
  // First bank - first block
  for (let i = 0; i <= 0x7f; i++) {
    expect(res[0]?.tilemap[i]).toEqual(i);
  }
  // Second bank - first block
  for (let i = 0x80; i <= 0xff; i++) {
    expect(res[0]?.tilemap[i]).toEqual(i - 0x80);
  }
  // First bank - second block
  for (let i = 0x100; i <= 0x180; i += 2) {
    expect(res[0]?.tilemap[i]).toEqual((i - 0x100) / 2 + 0x80);
  }
  // Second bank - second block
  for (let i = 0x101; i <= 0x180; i += 2) {
    expect(res[0]?.tilemap[i]).toEqual(Math.floor((i - 0x100) / 2) + 0x80);
  }
  // Overflow
  for (let i = 0x181; i < (res[0]?.tilemap?.length ?? 0); i++) {
    expect(res[0]?.tilemap[i]).toEqual(0xc0);
  }
});

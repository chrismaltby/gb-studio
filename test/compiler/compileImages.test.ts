import compileImages, {
  imageTileAllocationColorOnly,
  imageTileAllocationDefault,
} from "lib/compiler/compileImages";
import { ReferencedBackground } from "lib/compiler/precompile/determineUsedAssets";
import { Background } from "shared/lib/resources/types";

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
  expect(res[0].tilemap.length).toEqual(360);
  expect(res[0].vramData[0].length).toEqual(114 * BYTES_PER_TILE);
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
  expect(res[0].tilemap.length).toEqual(3136);
  expect(res[0].vramData[0].length).toEqual(192 * BYTES_PER_TILE);
  expect(res[0].vramData[1].length).toEqual(192 * BYTES_PER_TILE);
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
  expect(res[0].tilemap.length).toEqual(3136);
  expect(res[0].vramData[0].length).toEqual(384 * BYTES_PER_TILE);
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
  expect(res[0].tilemap.length).toEqual(1440);
  expect(res[0].vramData[0].length).toEqual(128 * BYTES_PER_TILE);
  expect(res[0].vramData[1].length).toEqual(63 * BYTES_PER_TILE);
});

test("Should allocate all tiles to VRAM1 in original order by default", () => {
  const backgroundData = {
    id: "img1",
    filename: "parallax.png",
  } as ReferencedBackground;
  for (let i = 0; i < 192; i++) {
    expect(imageTileAllocationDefault(i, 192, backgroundData)).toEqual({
      tileIndex: i,
      inVRAM2: false,
    });
  }
});

test("Should allocate first 128 tiles to vram1, next 128 to vram2 and split the rest evenly when in color only mode", () => {
  const backgroundData = [
    {
      id: "img1",
      filename: "parallax.png",
    },
  ] as unknown as Background;
  for (let i = 0; i < 384; i++) {
    let shouldBeVRAM2 = false;
    let index = i;
    // Tiles 128 to 255 go in vram2
    if (i >= 128 && i < 256) {
      shouldBeVRAM2 = true;
      index -= 128;
    }
    // After 255 tiles alternate between vram1 and vram2
    if (i >= 256) {
      shouldBeVRAM2 = i % 2 !== 0;
      index = Math.floor((i - 256) / 2) + 128;
    }

    expect(imageTileAllocationColorOnly(i, 384, backgroundData)).toEqual({
      tileIndex: index,
      inVRAM2: shouldBeVRAM2,
    });
  }
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
  expect(res[0].tilemap.length).toEqual(360);
  expect(res[0].vramData[0].length).toEqual(194 * BYTES_PER_TILE);
  expect(res[0].vramData[1].length).toEqual(0);
  for (let i = 0; i <= 0xc1; i++) {
    expect(res[0].tilemap[i]).toEqual(i);
  }
  for (let i = 0xc1; i < res[0].tilemap.length; i++) {
    expect(res[0].tilemap[i]).toEqual(0xc1);
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
  expect(res[0].tilemap.length).toEqual(640);
  expect(res[0].vramData[0].length).toEqual(193 * BYTES_PER_TILE);
  expect(res[0].vramData[1].length).toEqual(193 * BYTES_PER_TILE);
  // First bank - first block
  for (let i = 0; i <= 0x7f; i++) {
    expect(res[0].tilemap[i]).toEqual(i);
  }
  // Second bank - first block
  for (let i = 0x80; i <= 0xff; i++) {
    expect(res[0].tilemap[i]).toEqual(i - 0x80);
  }
  // First bank - second block
  for (let i = 0x100; i <= 0x180; i += 2) {
    expect(res[0].tilemap[i]).toEqual((i - 0x100) / 2 + 0x80);
  }
  // Second bank - second block
  for (let i = 0x101; i <= 0x180; i += 2) {
    expect(res[0].tilemap[i]).toEqual(Math.floor((i - 0x100) / 2) + 0x80);
  }
  // Overflow
  for (let i = 0x181; i < res[0].tilemap.length; i++) {
    expect(res[0].tilemap[i]).toEqual(0xc0);
  }
});

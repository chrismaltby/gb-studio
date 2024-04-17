import compileImages, {
  imageTileAllocationColorOnly,
  imageTileAllocationDefault,
} from "lib/compiler/compileImages";
import { BackgroundData } from "shared/lib/entities/entitiesTypes";

const BYTES_PER_TILE = 16;

test("should compile images", async () => {
  const backgroundData = [
    {
      id: "img1",
      filename: "boss.png",
    },
  ] as BackgroundData[];
  const res = await compileImages(
    backgroundData,
    {},
    [],
    false,
    `${__dirname}/_files/`,
    { warnings: () => {} }
  );
  expect(res[0].tilemap.length).toEqual(360);
  expect(res[0].vramData[0].length).toEqual(114 * BYTES_PER_TILE);
});

test("should compile split large images into two tilesets for CGB mode", async () => {
  const backgroundData = [
    {
      id: "img1",
      filename: "scribble.png",
    },
  ] as BackgroundData[];
  const res = await compileImages(
    backgroundData,
    {},
    [],
    true,
    `${__dirname}/_files/`,
    { warnings: () => {} }
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
  ] as BackgroundData[];
  const res = await compileImages(
    backgroundData,
    {},
    [],
    false,
    `${__dirname}/_files/`,
    { warnings: () => {} }
  );
  expect(res[0].tilemap.length).toEqual(3136);
  expect(res[0].vramData[0].length).toEqual(384 * BYTES_PER_TILE);
});

test("should split tiles into two banks when in color only mode, filling first 128 tiles of vram bank 1 first", async () => {
  const backgroundData = [
    {
      id: "img1",
      filename: "parallax.png",
    },
  ] as BackgroundData[];
  const res = await compileImages(
    backgroundData,
    {},
    [],
    true,
    `${__dirname}/_files/`,
    { warnings: () => {} }
  );
  expect(res[0].tilemap.length).toEqual(1440);
  expect(res[0].vramData[0].length).toEqual(128 * BYTES_PER_TILE);
  expect(res[0].vramData[1].length).toEqual(63 * BYTES_PER_TILE);
});

test("Should allocate all tiles to VRAM1 in original order by default", () => {
  const backgroundData = [
    {
      id: "img1",
      filename: "parallax.png",
    },
  ] as unknown as BackgroundData;
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
  ] as unknown as BackgroundData;
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

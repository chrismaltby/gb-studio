import compileImages from "lib/compiler/compileImages";
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
    [],
    false,
    `${__dirname}/_files/`,
    `${__dirname}/_tmp/`,
    { warnings: () => {} }
  );
  expect(res.tilemaps["img1"].length).toEqual(360);
  expect(res.tilemapsTileset["img1"].length).toEqual(1);
  expect(res.tilesets[res.tilemapsTileset["img1"][0]].length).toEqual(
    114 * BYTES_PER_TILE
  );
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
    [],
    true,
    `${__dirname}/_files/`,
    `${__dirname}/_tmp/`,
    { warnings: () => {} }
  );
  expect(res.tilemaps["img1"].length).toEqual(3136);
  expect(res.tilemapsTileset["img1"].length).toEqual(2);
  expect(res.tilesets[res.tilemapsTileset["img1"][0]].length).toEqual(
    192 * BYTES_PER_TILE
  );
  expect(res.tilesets[res.tilemapsTileset["img1"][1]].length).toEqual(
    192 * BYTES_PER_TILE
  );
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
    [],
    false,
    `${__dirname}/_files/`,
    `${__dirname}/_tmp/`,
    { warnings: () => {} }
  );
  expect(res.tilemaps["img1"].length).toEqual(3136);
  expect(res.tilemapsTileset["img1"].length).toEqual(1);
  expect(res.tilesets[res.tilemapsTileset["img1"][0]].length).toEqual(
    384 * BYTES_PER_TILE
  );
});

test("should split tiles into two banks evenly when in color only mode", async () => {
  const backgroundData = [
    {
      id: "img1",
      filename: "parallax.png",
    },
  ] as BackgroundData[];
  const res = await compileImages(
    backgroundData,
    [],
    true,
    `${__dirname}/_files/`,
    `${__dirname}/_tmp/`,
    { warnings: () => {} }
  );
  expect(res.tilemaps["img1"].length).toEqual(1440);
  expect(res.tilemapsTileset["img1"].length).toEqual(2);
  expect(res.tilesets[res.tilemapsTileset["img1"][0]].length).toEqual(
    96 * BYTES_PER_TILE
  );
  expect(res.tilesets[res.tilemapsTileset["img1"][1]].length).toEqual(
    95 * BYTES_PER_TILE
  );
});

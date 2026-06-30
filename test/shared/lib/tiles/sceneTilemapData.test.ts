import {
  buildSceneTilesetIndex,
  decodeSceneTileRef,
  encodeSceneTileRef,
  flattenTilemapLayers,
} from "shared/lib/tiles/sceneTilemapData";

const tilesetsLookup = {
  grass: { id: "grass", width: 5, height: 1 },
  unused: { id: "unused", width: 5, height: 1 },
  props: { id: "props", width: 10, height: 10 },
  tiles: { id: "tiles", width: 8, height: 8 },
};

const PROPS_TILESET_OFFSET = 10;

test("encodes and decodes scene tile references", () => {
  const tilemap = {
    tilesets: [
      tilesetsLookup.grass,
      tilesetsLookup.unused,
      tilesetsLookup.props,
    ],
  };
  const tilesetIndex = buildSceneTilesetIndex(tilemap);

  expect(tilesetIndex[2]).toMatchObject({
    tilesetId: "props",
    offset: PROPS_TILESET_OFFSET,
  });
  expect(
    decodeSceneTileRef(
      encodeSceneTileRef(PROPS_TILESET_OFFSET, 14),
      tilesetIndex,
    ),
  ).toEqual({
    absoluteIndex: PROPS_TILESET_OFFSET + 14,
    tilesetIndex: 2,
    tileIndex: 14,
    tilesetId: "props",
    tilesetOffset: PROPS_TILESET_OFFSET,
  });
  expect(decodeSceneTileRef(0, tilesetIndex)).toBeUndefined();
});

test("flattens visible layers while keeping scene tile colors independent", () => {
  const result = flattenTilemapLayers(
    {
      tilesets: [tilesetsLookup.tiles],
      tileColors: [3, 7],
      layers: [
        { id: "a", name: "A", visible: true, tiles: [1, 2] },
        { id: "b", name: "B", visible: false, tiles: [5, 5] },
        { id: "c", name: "C", visible: true, tiles: [0, 6] },
      ],
    },
    2,
    1,
  );
  expect(result).toEqual([1, 6]);
});

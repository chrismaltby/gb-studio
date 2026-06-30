import {
  buildSceneTilesetIndex,
  buildSceneTilesetLookup,
  decodeSceneTileRef,
  decodeSceneTileRefFromLookup,
  encodeSceneTileRef,
  flattenTilemapLayers,
  pruneTilemapLayersTilesets,
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

describe("pruneTilemapLayersTilesets", () => {
  test("keeps tilesets referenced only by autotiles", () => {
    const propsOffset = buildSceneTilesetIndex({
      tilesets: [tilesetsLookup.grass, tilesetsLookup.props],
    })[1]?.offset;

    const result = pruneTilemapLayersTilesets({
      tilesets: [tilesetsLookup.grass, tilesetsLookup.props],
      layers: [
        {
          id: "layer",
          name: "Layer",
          visible: true,
          tiles: [0],
          autotiles: [encodeSceneTileRef(propsOffset ?? 0, 3)],
        },
      ],
    });

    expect(result.tilesets).toContainEqual(
      expect.objectContaining({ id: "props" }),
    );
  });

  test("remaps autotile refs after pruning earlier unused tilesets", () => {
    const propsTileIndex = 7;
    const propsOffset = buildSceneTilesetIndex({
      tilesets: [tilesetsLookup.unused, tilesetsLookup.props],
    })[1]?.offset;

    const result = pruneTilemapLayersTilesets({
      tilesets: [tilesetsLookup.unused, tilesetsLookup.props],
      layers: [
        {
          id: "layer",
          name: "Layer",
          visible: true,
          tiles: [0],
          autotiles: [encodeSceneTileRef(propsOffset ?? 0, propsTileIndex)],
        },
      ],
    });

    const tilesetIndex = buildSceneTilesetIndex(result);
    const ref = decodeSceneTileRef(
      result.layers[0]?.autotiles?.[0] ?? 0,
      tilesetIndex,
    );

    expect(result.tilesets).toEqual([tilesetsLookup.props]);
    expect(ref).toEqual({
      absoluteIndex: propsTileIndex,
      tilesetIndex: 0,
      tileIndex: propsTileIndex,
      tilesetId: "props",
      tilesetOffset: 0,
    });
  });
});

test("encodes and decodes scene tile references", () => {
  const tilemap = {
    tilesets: [
      tilesetsLookup.grass,
      tilesetsLookup.unused,
      tilesetsLookup.props,
    ],
  };
  const tilesetIndex = buildSceneTilesetIndex(tilemap);
  const tilesetLookup = buildSceneTilesetLookup(tilemap);
  const encodedRef = encodeSceneTileRef(PROPS_TILESET_OFFSET, 14);

  const expectedRef = {
    absoluteIndex: PROPS_TILESET_OFFSET + 14,
    tilesetIndex: 2,
    tileIndex: 14,
    tilesetId: "props",
    tilesetOffset: PROPS_TILESET_OFFSET,
  };

  expect(tilesetIndex[2]).toMatchObject({
    tilesetId: "props",
    offset: PROPS_TILESET_OFFSET,
  });

  expect(decodeSceneTileRef(encodedRef, tilesetIndex)).toEqual(expectedRef);
  expect(decodeSceneTileRefFromLookup(encodedRef, tilesetLookup)).toEqual(
    expectedRef,
  );
  expect(decodeSceneTileRef(0, tilesetIndex)).toBeUndefined();
  expect(decodeSceneTileRefFromLookup(0, tilesetLookup)).toBeUndefined();
});

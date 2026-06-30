import {
  buildSceneTilesetLookup,
  decodeSceneTileRef,
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
  const tilesetLookup = buildSceneTilesetLookup(tilemap);

  expect(tilesetLookup.entries[2]).toMatchObject({
    tilesetId: "props",
    offset: PROPS_TILESET_OFFSET,
  });
  expect(
    decodeSceneTileRef(
      encodeSceneTileRef(PROPS_TILESET_OFFSET, 14),
      tilesetLookup,
    ),
  ).toEqual({
    absoluteIndex: PROPS_TILESET_OFFSET + 14,
    tilesetIndex: 2,
    tileIndex: 14,
    tilesetId: "props",
    tilesetOffset: PROPS_TILESET_OFFSET,
  });
  expect(decodeSceneTileRef(0, tilesetLookup)).toBeUndefined();
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
    const propsOffset = buildSceneTilesetLookup({
      tilesets: [tilesetsLookup.grass, tilesetsLookup.props],
    }).entries[1]?.offset;

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
    const propsOffset = buildSceneTilesetLookup({
      tilesets: [tilesetsLookup.unused, tilesetsLookup.props],
    }).entries[1]?.offset;

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

    const tilesetLookup = buildSceneTilesetLookup(result);
    const ref = decodeSceneTileRef(
      result.layers[0]?.autotiles?.[0] ?? 0,
      tilesetLookup,
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

  test("prunes unused tilesets and rewrites references across every layer", () => {
    const result = pruneTilemapLayersTilesets({
      tilesets: [
        tilesetsLookup.grass,
        tilesetsLookup.unused,
        tilesetsLookup.props,
        tilesetsLookup.props,
      ],
      layers: [
        {
          id: "visible",
          name: "Visible",
          visible: true,
          tiles: [encodeSceneTileRef(0, 4), encodeSceneTileRef(10, 7)],
        },
        {
          id: "hidden",
          name: "Hidden",
          visible: false,
          tiles: [encodeSceneTileRef(110, 9)],
          autotiles: [encodeSceneTileRef(110, 9)],
        },
      ],
    });
    const tilesetLookup = buildSceneTilesetLookup(result);

    expect(result.tilesets).toEqual([
      tilesetsLookup.grass,
      tilesetsLookup.props,
    ]);
    expect(
      result.layers[0]?.tiles.map((value) =>
        decodeSceneTileRef(value, tilesetLookup),
      ),
    ).toEqual([
      {
        absoluteIndex: 4,
        tilesetIndex: 0,
        tileIndex: 4,
        tilesetId: "grass",
        tilesetOffset: 0,
      },
      {
        absoluteIndex: 12,
        tilesetIndex: 1,
        tileIndex: 7,
        tilesetId: "props",
        tilesetOffset: 5,
      },
    ]);
    expect(
      decodeSceneTileRef(result.layers[1]?.tiles[0] ?? 0, tilesetLookup),
    ).toEqual({
      absoluteIndex: 14,
      tilesetIndex: 1,
      tileIndex: 9,
      tilesetId: "props",
      tilesetOffset: 5,
    });
    expect(
      decodeSceneTileRef(result.layers[1]?.autotiles?.[0] ?? 0, tilesetLookup),
    ).toEqual({
      absoluteIndex: 14,
      tilesetIndex: 1,
      tileIndex: 9,
      tilesetId: "props",
      tilesetOffset: 5,
    });
  });
});

import {
  AUTOTILE_VARIANT_MASKS,
  buildSceneTilesetLookup,
  clearTilemapLayerSelection,
  decodeSceneTileRef,
  encodeSceneTileRef,
  flattenTilemapLayers,
  isTilemapLayerCellTopmost,
  moveTilemapLayerSelection,
  pruneTilemapLayersTilesets,
  resolveSceneAutotiles,
  resolveSceneAutotilesForCells,
  sceneStampLinePositions,
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

describe("moveTilemapLayerSelection", () => {
  test("moves a tile selection atomically and clears its source cells", () => {
    const result = moveTilemapLayerSelection(
      {
        id: "layer1",
        name: "Layer 1",
        visible: true,
        tiles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      },
      4,
      3,
      { x: 1, y: 0, width: 2, height: 2 },
      { x: 1, y: 1 },
    );

    expect(result.tiles).toEqual([1, 0, 0, 4, 5, 0, 2, 3, 9, 10, 6, 7]);
  });

  test("moves autotile references with a tile selection", () => {
    const autotile = encodeSceneTileRef(0, 10);
    const result = moveTilemapLayerSelection(
      {
        id: "layer1",
        name: "Layer 1",
        visible: true,
        tiles: new Array(12).fill(0),
        autotiles: [0, autotile, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
      4,
      3,
      { x: 1, y: 0, width: 1, height: 1 },
      { x: 1, y: 1 },
    );

    expect(result.autotiles).toEqual([
      0,
      0,
      0,
      0,
      0,
      0,
      autotile,
      0,
      0,
      0,
      0,
      0,
    ]);
  });

  test("moves tilemap layer selections without adding missing autotiles", () => {
    const result = moveTilemapLayerSelection(
      {
        id: "layer1",
        name: "Layer 1",
        visible: true,
        tiles: [1, 2, 3, 4],
      },
      2,
      2,
      { x: 0, y: 0, width: 1, height: 1 },
      { x: 1, y: 0 },
    );

    expect(result.tiles).toEqual([0, 1, 3, 4]);
    expect(result.autotiles).toBeUndefined();
  });
});

describe("clearTilemapLayerSelection", () => {
  test("clears tiles and autotiles from a tilemap layer selection", () => {
    const autotile = encodeSceneTileRef(0, 10);
    const result = clearTilemapLayerSelection(
      {
        id: "layer1",
        name: "Layer 1",
        visible: true,
        tiles: [1, 2, 3, 4, 5, 6],
        autotiles: [0, autotile, autotile, 0, autotile, autotile],
      },
      3,
      2,
      { x: 1, y: 0, width: 2, height: 2 },
    );

    expect(result.tiles).toEqual([1, 0, 0, 4, 0, 0]);
    expect(result.autotiles).toEqual([0, 0, 0, 0, 0, 0]);
  });

  test("clears tilemap layer selections without adding missing autotiles", () => {
    const result = clearTilemapLayerSelection(
      {
        id: "layer1",
        name: "Layer 1",
        visible: true,
        tiles: [1, 2, 3, 4],
      },
      2,
      2,
      { x: 1, y: 0, width: 1, height: 2 },
    );

    expect(result.tiles).toEqual([1, 0, 3, 0]);
    expect(result.autotiles).toBeUndefined();
  });
});

describe("sceneStampLinePositions", () => {
  test("spaces horizontal stamp positions by the stamp footprint", () => {
    expect(sceneStampLinePositions(2, 3, 21, 3, 6, 6)).toEqual([
      { x: 8, y: 3 },
      { x: 14, y: 3 },
      { x: 20, y: 3 },
    ]);
  });

  test("spaces vertical stamp positions by the stamp footprint", () => {
    expect(sceneStampLinePositions(4, 2, 4, 11, 3, 3)).toEqual([
      { x: 4, y: 5 },
      { x: 4, y: 8 },
      { x: 4, y: 11 },
    ]);
  });

  test("returns no stamp positions when movement is smaller than the footprint", () => {
    expect(sceneStampLinePositions(2, 3, 4, 4, 6, 6)).toEqual([]);
    expect(sceneStampLinePositions(2, 3, 2, 3, 6, 6)).toEqual([]);
  });
});

describe("isTilemapLayerCellTopmost", () => {
  test("detects whether a tilemap layer cell is topmost", () => {
    const tilemap = {
      tilesets: [tilesetsLookup.tiles],
      layers: [
        { id: "bottom", name: "Bottom", visible: true, tiles: [1, 2, 3] },
        { id: "middle", name: "Middle", visible: false, tiles: [4, 0, 4] },
        { id: "top", name: "Top", visible: true, tiles: [0, 5, 0] },
      ],
    };

    expect(isTilemapLayerCellTopmost(tilemap, 0, 0)).toBe(true);
    expect(isTilemapLayerCellTopmost(tilemap, 0, 1)).toBe(false);
    expect(isTilemapLayerCellTopmost(tilemap, 1, 0)).toBe(false);
    expect(isTilemapLayerCellTopmost(tilemap, 2, 1)).toBe(true);
    expect(isTilemapLayerCellTopmost(tilemap, 0, 2)).toBe(true);
    expect(isTilemapLayerCellTopmost(tilemap, 2, 0)).toBe(false);
    expect(isTilemapLayerCellTopmost(tilemap, 99, 0)).toBe(false);
  });
});

describe("resolveSceneAutotiles", () => {
  test("sparse resolution matches whole-layer resolution", () => {
    const base = encodeSceneTileRef(0, 2);
    const autotiles = [0, base, 0, base, base, base, 0, base, 0];
    const tilemap = {
      tilesets: [{ id: "tiles", width: 8, height: 8 }],
    };
    const indexes = [1, 3, 4, 5, 7];
    const wholeLayer = resolveSceneAutotiles(autotiles, 3, 3, tilemap);
    const sparse = resolveSceneAutotilesForCells(
      autotiles,
      3,
      3,
      buildSceneTilesetLookup(tilemap),
      indexes,
    );

    for (const index of indexes) {
      expect(sparse.get(index)).toBe(wholeLayer[index]);
    }
  });

  test("resolves all 16 2x2 autotile variants from a 4x4 tile block", () => {
    expect(AUTOTILE_VARIANT_MASKS).toHaveLength(16);
    const tilesetWidth = 8;
    const base = encodeSceneTileRef(32, 100);
    const autotileTilesets = {
      a: { id: "a", width: 1, height: 1 },
      b: { id: "b", width: 31, height: 1 },
      tiles: { id: "tiles", width: tilesetWidth, height: 20 },
    };
    const tilemap = {
      tilesets: [
        autotileTilesets.a,
        autotileTilesets.b,
        autotileTilesets.tiles,
      ],
    };
    const tilesetLookup = buildSceneTilesetLookup(tilemap);

    for (const [variant, mask] of AUTOTILE_VARIANT_MASKS.entries()) {
      const autotiles = new Array(9).fill(0);
      autotiles[4] = base;
      if (mask & 1) [1, 3, 0].forEach((index) => (autotiles[index] = base));
      if (mask & 2) [1, 5, 2].forEach((index) => (autotiles[index] = base));
      if (mask & 4) [7, 5, 8].forEach((index) => (autotiles[index] = base));
      if (mask & 8) [7, 3, 6].forEach((index) => (autotiles[index] = base));

      const resolved = decodeSceneTileRef(
        resolveSceneAutotiles(autotiles, 3, 3, tilemap)[4],
        tilesetLookup,
      );

      expect(resolved?.absoluteIndex).toBe(
        32 + 100 + (variant % 4) + Math.floor(variant / 4) * tilesetWidth,
      );
    }
  });

  test("treats out-of-bounds autotile neighbours as connected", () => {
    const tilesetWidth = 8;
    const base = encodeSceneTileRef(0, 0);
    const tilemap = {
      tilesets: [{ id: "tiles", width: tilesetWidth, height: 4 }],
    };

    const resolved = decodeSceneTileRef(
      resolveSceneAutotiles([base], 1, 1, tilemap)[0],
      buildSceneTilesetLookup(tilemap),
    );

    const variant = AUTOTILE_VARIANT_MASKS.indexOf(15);

    expect(resolved?.absoluteIndex).toBe(
      (variant % 4) + Math.floor(variant / 4) * tilesetWidth,
    );
  });

  test("resolves empty and invalid autotile refs to blank tiles", () => {
    const tilemap = {
      tilesets: [{ id: "tiles", width: 8, height: 4 }],
    };

    expect(resolveSceneAutotiles([0], 1, 1, tilemap)).toEqual([0]);

    const invalidRef = encodeSceneTileRef(100, 0);
    expect(resolveSceneAutotiles([invalidRef], 1, 1, tilemap)).toEqual([0]);
  });

  test("does not connect neighbouring autotiles with different source refs", () => {
    const tilesetWidth = 8;
    const base = encodeSceneTileRef(0, 0);
    const other = encodeSceneTileRef(0, 1);
    const tilemap = {
      tilesets: [{ id: "tiles", width: tilesetWidth, height: 4 }],
    };
    const tilesetLookup = buildSceneTilesetLookup(tilemap);

    const resolved = decodeSceneTileRef(
      resolveSceneAutotiles([base, other], 2, 1, tilemap)[0],
      tilesetLookup,
    );

    // Out of bounds north/west/south are connected, but east is a different ref.
    const variant = AUTOTILE_VARIANT_MASKS.indexOf(9);

    expect(resolved?.absoluteIndex).toBe(
      (variant % 4) + Math.floor(variant / 4) * tilesetWidth,
    );
  });
});

import {
  getCollisionSelectionPreview,
  getColorSelectionPreview,
  getLinkedTileSelectionPreviewMasks,
  getTileSelectionPreview,
  shouldPreviewCollisionSelection,
} from "components/world/entities/scenes/helpers/sceneSelectionPreview";
import { ScenePaintSelection } from "store/features/editor/editorState";
import { SceneTilemapData } from "shared/lib/resources/types";

const offset = { x: 1, y: 0 };

const selection = (
  mode: ScenePaintSelection["mode"] = "tiles",
  overrides: Partial<ScenePaintSelection> = {},
): ScenePaintSelection => ({
  sceneId: "scene1",
  layerId: "lower",
  mode,
  selection: { x: 0, y: 0, width: 1, height: 1 },
  offset,
  ...overrides,
});

const tilemap = (
  overrides: Partial<SceneTilemapData> = {},
): SceneTilemapData => ({
  tilesets: [],
  tileColors: [4, 5, 6],
  layers: [
    {
      id: "lower",
      name: "Lower",
      visible: true,
      tiles: [1, 0, 0],
    },
    {
      id: "upper",
      name: "Upper",
      visible: true,
      tiles: [0, 0, 0],
    },
  ],
  ...overrides,
});

const scene = (tilemapData: SceneTilemapData | null = tilemap()) => ({
  width: 3,
  height: 1,
  collisions: [1, 2, 3],
  tilemap: tilemapData ?? undefined,
});

describe("shouldPreviewCollisionSelection", () => {
  test.each([
    ["collisions", true],
    ["tiles", true],
    ["colors", false],
  ] as const)("returns %s for %s selections", (mode, expected) => {
    expect(shouldPreviewCollisionSelection(mode)).toBe(expected);
  });
});

describe("getTileSelectionPreview", () => {
  test("moves the selected tiles", () => {
    const preview = getTileSelectionPreview({
      scene: scene(),
      selection: selection(),
      offset,
    });

    expect(preview?.tilemap.layers[0]?.tiles).toEqual([0, 1, 0]);
  });

  test("clips a selection moved partly outside the scene", () => {
    const preview = getTileSelectionPreview({
      scene: scene(
        tilemap({
          layers: [
            {
              id: "lower",
              name: "Lower",
              visible: true,
              tiles: [1, 2, 0],
            },
          ],
        }),
      ),
      selection: selection("tiles", {
        selection: { x: 0, y: 0, width: 2, height: 1 },
      }),
      offset: { x: -1, y: 0 },
    });

    expect(preview?.tilemap.layers[0]?.tiles).toEqual([2, 0, 0]);
  });

  test("moves autotile references and resolves their displayed tiles", () => {
    const preview = getTileSelectionPreview({
      scene: scene(
        tilemap({
          tilesets: [{ id: "tiles", width: 4, height: 4 }],
          autotiles: [{ type: "2x2", startTile: 1 }],
          layers: [
            {
              id: "lower",
              name: "Lower",
              visible: true,
              tiles: [1, 0, 0],
              autotiles: [1, 0, 0],
            },
          ],
        }),
      ),
      selection: selection(),
      offset,
    });

    expect(preview?.tilemap.layers[0]?.autotiles).toEqual([0, 1, 0]);
    expect(preview?.tilemap.layers[0]?.tiles[0]).toBe(0);
    expect(preview?.tilemap.layers[0]?.tiles[1]).not.toBe(0);
  });

  test("does not mutate the original tilemap", () => {
    const originalTilemap = tilemap();
    const originalTiles = originalTilemap.layers[0]?.tiles;

    getTileSelectionPreview({
      scene: scene(originalTilemap),
      selection: selection(),
      offset,
    });

    expect(originalTilemap.layers[0]?.tiles).toBe(originalTiles);
    expect(originalTiles).toEqual([1, 0, 0]);
  });

  test.each([
    ["missing scene", undefined, selection(), offset],
    ["scene without tilemap", scene(null), selection(), offset],
    ["missing selection", scene(), undefined, offset],
    ["non-tile selection", scene(), selection("colors"), offset],
    ["zero offset", scene(), selection(), { x: 0, y: 0 }],
    [
      "missing layer",
      scene(),
      selection("tiles", { layerId: "missing" }),
      offset,
    ],
  ])(
    "returns undefined for %s",
    (_name, previewScene, paintSelection, move) => {
      expect(
        getTileSelectionPreview({
          scene: previewScene,
          selection: paintSelection,
          offset: move,
        }),
      ).toBeUndefined();
    },
  );
});

describe("getLinkedTileSelectionPreviewMasks", () => {
  const masksFor = (previewScene = scene()) => {
    const paintSelection = selection();
    const preview = getTileSelectionPreview({
      scene: previewScene,
      selection: paintSelection,
      offset,
    });
    return getLinkedTileSelectionPreviewMasks({
      scene: previewScene,
      selection: paintSelection,
      tileSelectionPreview: preview,
    });
  };

  test("allows movement from and to topmost visible cells", () => {
    const masks = masksFor();

    expect(masks?.shouldMoveSource(0)).toBe(true);
    expect(masks?.shouldWriteTarget(1, 0)).toBe(true);
  });

  test("rejects a source hidden by a higher visible tile", () => {
    const masks = masksFor(
      scene(
        tilemap({
          layers: [
            tilemap().layers[0],
            { ...tilemap().layers[1], tiles: [2, 0, 0] },
          ],
        }),
      ),
    );

    expect(masks?.shouldMoveSource(0)).toBe(false);
  });

  test("allows a source covered only by a hidden layer", () => {
    const masks = masksFor(
      scene(
        tilemap({
          layers: [
            tilemap().layers[0],
            { ...tilemap().layers[1], visible: false, tiles: [2, 0, 0] },
          ],
        }),
      ),
    );

    expect(masks?.shouldMoveSource(0)).toBe(true);
  });

  test("rejects a destination hidden by a higher visible tile", () => {
    const masks = masksFor(
      scene(
        tilemap({
          layers: [
            tilemap().layers[0],
            { ...tilemap().layers[1], tiles: [0, 2, 0] },
          ],
        }),
      ),
    );

    expect(masks?.shouldWriteTarget(1, 0)).toBe(false);
  });

  test.each([
    ["missing scene", undefined, selection(), undefined],
    ["missing selection", scene(), undefined, undefined],
    ["non-tile selection", scene(), selection("colors"), undefined],
    ["missing preview", scene(), selection(), undefined],
    [
      "missing layer",
      scene(),
      selection("tiles", { layerId: "missing" }),
      getTileSelectionPreview({
        scene: scene(),
        selection: selection(),
        offset,
      }),
    ],
  ])(
    "returns undefined for %s",
    (_name, previewScene, paintSelection, preview) => {
      expect(
        getLinkedTileSelectionPreviewMasks({
          scene: previewScene,
          selection: paintSelection,
          tileSelectionPreview: preview,
        }),
      ).toBeUndefined();
    },
  );
});

describe("getCollisionSelectionPreview", () => {
  test("moves collision selections", () => {
    expect(
      getCollisionSelectionPreview({
        scene: scene(),
        selection: selection("collisions"),
        offset,
      }),
    ).toEqual([0, 1, 3]);
  });

  test("clips collision selections moved outside the scene", () => {
    expect(
      getCollisionSelectionPreview({
        scene: scene(),
        selection: selection("collisions", {
          selection: { x: 0, y: 0, width: 2, height: 1 },
        }),
        offset: { x: -1, y: 0 },
      }),
    ).toEqual([2, 0, 3]);
  });

  test("uses linked masks for tile selections", () => {
    expect(
      getCollisionSelectionPreview({
        scene: scene(),
        selection: selection(),
        offset,
        linkedMasks: {
          shouldMoveSource: () => true,
          shouldWriteTarget: () => false,
        },
      }),
    ).toEqual([0, 2, 3]);
  });

  test("does not mutate source collisions", () => {
    const originalScene = scene();
    const collisions = originalScene.collisions;

    getCollisionSelectionPreview({
      scene: originalScene,
      selection: selection("collisions"),
      offset,
    });

    expect(originalScene.collisions).toBe(collisions);
    expect(collisions).toEqual([1, 2, 3]);
  });

  test.each([
    ["missing scene", undefined, selection("collisions"), offset, undefined],
    ["missing selection", scene(), undefined, offset, undefined],
    [
      "zero offset",
      scene(),
      selection("collisions"),
      { x: 0, y: 0 },
      undefined,
    ],
    ["color mode", scene(), selection("colors"), offset, undefined],
    ["tile mode without masks", scene(), selection(), offset, undefined],
  ])(
    "returns undefined for %s",
    (_name, previewScene, paintSelection, move, linkedMasks) => {
      expect(
        getCollisionSelectionPreview({
          scene: previewScene,
          selection: paintSelection,
          offset: move,
          linkedMasks,
        }),
      ).toBeUndefined();
    },
  );
});

describe("getColorSelectionPreview", () => {
  test("moves image-scene colors from the supplied color map", () => {
    expect(
      getColorSelectionPreview({
        scene: scene(null),
        selection: selection("colors"),
        offset,
        tileColors: [7, 8, 9],
      }),
    ).toEqual([0, 7, 9]);
  });

  test("prefers tilemap colors over the supplied image color map", () => {
    expect(
      getColorSelectionPreview({
        scene: scene(),
        selection: selection("colors"),
        offset,
        tileColors: [7, 8, 9],
      }),
    ).toEqual([0, 4, 6]);
  });

  test("uses linked masks for tile selections", () => {
    expect(
      getColorSelectionPreview({
        scene: scene(),
        selection: selection(),
        offset,
        linkedMasks: {
          shouldMoveSource: () => true,
          shouldWriteTarget: () => false,
        },
        tileColors: [],
      }),
    ).toEqual([0, 5, 6]);
  });

  test("handles a tilemap without a color map", () => {
    expect(
      getColorSelectionPreview({
        scene: scene(tilemap({ tileColors: undefined })),
        selection: selection("colors"),
        offset,
        tileColors: [7, 8, 9],
      }),
    ).toEqual([0, 0, 0]);
  });

  test("does not mutate either source color map", () => {
    const tilemapData = tilemap();
    const tilemapColors = tilemapData.tileColors;
    const imageColors = [7, 8, 9];

    getColorSelectionPreview({
      scene: scene(tilemapData),
      selection: selection("colors"),
      offset,
      tileColors: imageColors,
    });

    expect(tilemapData.tileColors).toBe(tilemapColors);
    expect(tilemapColors).toEqual([4, 5, 6]);
    expect(imageColors).toEqual([7, 8, 9]);
  });

  test.each([
    ["missing scene", undefined, selection("colors"), offset, undefined],
    ["missing selection", scene(), undefined, offset, undefined],
    ["zero offset", scene(), selection("colors"), { x: 0, y: 0 }, undefined],
    ["collision mode", scene(), selection("collisions"), offset, undefined],
    ["tile mode without masks", scene(), selection(), offset, undefined],
  ])(
    "returns undefined for %s",
    (_name, previewScene, paintSelection, move, linkedMasks) => {
      expect(
        getColorSelectionPreview({
          scene: previewScene,
          selection: paintSelection,
          offset: move,
          linkedMasks,
          tileColors: [],
        }),
      ).toBeUndefined();
    },
  );
});

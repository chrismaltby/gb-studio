/* eslint-disable camelcase */
import reducer, { initialState } from "store/features/entities/entitiesState";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import actions from "store/features/entities/entitiesActions";
import {
  dummySceneNormalized,
  dummyTilesetResource,
} from "../../../../dummydata";
import { TILE_DEFAULT_UNSET, TILE_SIZE } from "consts";
import { encodeSceneTileRef } from "shared/lib/tiles/sceneTilemapData";
import { CompressedTilesetResourceAsset } from "shared/lib/resources/types";

test("Should paint palette and priority defaults onto tilesets", () => {
  const state: EntitiesState = {
    ...initialState,
    tilesets: {
      entities: {
        tiles1: {
          ...dummyTilesetResource,
          id: "tiles1",
          width: 2,
          height: 2,
          imageWidth: 16,
          imageHeight: 16,
          tileColors: [],
          tileCollisions: [],
          inode: "tiles1",
          _v: 0,
        },
      },
      ids: ["tiles1"],
    },
  };
  const colored = reducer(
    state,
    actions.paintTilesetColor({
      tilesetId: "tiles1",
      x: 0,
      y: 0,
      value: 3,
      isTileProp: false,
    }),
  );
  const prioritized = reducer(
    colored,
    actions.paintTilesetColor({
      tilesetId: "tiles1",
      x: 0,
      y: 0,
      value: 0x80,
      isTileProp: true,
    }),
  );
  expect(prioritized.tilesets.entities.tiles1?.tileColors).toEqual([
    0x83,
    TILE_DEFAULT_UNSET,
    TILE_DEFAULT_UNSET,
    TILE_DEFAULT_UNSET,
  ]);
  const collisionPainted = reducer(
    prioritized,
    actions.paintTilesetCollision({
      tilesetId: "tiles1",
      x: 1,
      y: 0,
      value: 0x0f,
      mask: 0xff,
    }),
  );
  expect(collisionPainted.tilesets.entities.tiles1?.tileCollisions).toEqual([
    TILE_DEFAULT_UNSET,
    0x0f,
    TILE_DEFAULT_UNSET,
    TILE_DEFAULT_UNSET,
  ]);
});

test("Should register a 4x4 tileset autotile group", () => {
  const state: EntitiesState = {
    ...initialState,
    tilesets: {
      entities: {
        tiles1: {
          ...dummyTilesetResource,
          id: "tiles1",
          width: 8,
          height: 8,
          imageWidth: 64,
          imageHeight: 64,
          tileColors: [],
          tileCollisions: [],
          inode: "tiles1",
          _v: 0,
        },
      },
      ids: ["tiles1"],
    },
  };

  const registered = reducer(
    state,
    actions.toggleTilesetAutotileGroup({
      tilesetId: "tiles1",
      tileIndex: 9,
    }),
  );

  expect(registered.tilesets.entities.tiles1?.autotiles).toEqual([
    { type: "2x2", startTile: 9 },
  ]);
});

test("Should register a 3x3 tileset 9-slice autotile", () => {
  const state: EntitiesState = {
    ...initialState,
    tilesets: {
      entities: {
        tiles1: {
          ...dummyTilesetResource,
          id: "tiles1",
          width: 8,
          height: 8,
          imageWidth: 64,
          imageHeight: 64,
          tileColors: [],
          tileCollisions: [],
          inode: "tiles1",
          _v: 0,
        },
      },
      ids: ["tiles1"],
    },
  };

  const registered = reducer(
    state,
    actions.toggleTilesetAutotileGroup({
      tilesetId: "tiles1",
      tileIndex: 9,
      type: "9slice",
    }),
  );

  expect(registered.tilesets.entities.tiles1?.autotiles).toEqual([
    { type: "9slice", startTile: 9 },
  ]);
});

test("Should remove a tileset autotile group when clicking inside it", () => {
  const state: EntitiesState = {
    ...initialState,
    tilesets: {
      entities: {
        tiles1: {
          ...dummyTilesetResource,
          id: "tiles1",
          width: 8,
          height: 8,
          imageWidth: 64,
          imageHeight: 64,
          tileColors: [],
          tileCollisions: [],
          autotiles: [{ type: "2x2", startTile: 9 }],
          inode: "tiles1",
          _v: 0,
        },
      },
      ids: ["tiles1"],
    },
  };

  const removed = reducer(
    state,
    actions.toggleTilesetAutotileGroup({
      tilesetId: "tiles1",
      // Inside the 4x4 group starting at index 9
      tileIndex: 18,
    }),
  );

  expect(removed.tilesets.entities.tiles1?.autotiles).toEqual([]);
});

test("Should ignore invalid tileset autotile group origins", () => {
  const state: EntitiesState = {
    ...initialState,
    tilesets: {
      entities: {
        tiles1: {
          ...dummyTilesetResource,
          id: "tiles1",
          width: 8,
          height: 8,
          imageWidth: 64,
          imageHeight: 64,
          tileColors: [],
          tileCollisions: [],
          autotiles: [{ type: "2x2", startTile: 9 }],
          inode: "tiles1",
          _v: 0,
        },
      },
      ids: ["tiles1"],
    },
  };

  const unchanged = reducer(
    state,
    actions.toggleTilesetAutotileGroup({
      tilesetId: "tiles1",
      tileIndex: 63,
    }),
  );

  expect(unchanged.tilesets.entities.tiles1?.autotiles).toEqual([
    { type: "2x2", startTile: 9 },
  ]);
});

test("Should automatically grow a loaded tileset and remap scene references", () => {
  const state: EntitiesState = {
    ...initialState,
    tilesets: {
      entities: {
        tiles1: {
          ...dummyTilesetResource,
          id: "tiles1",
          width: 2,
          height: 2,
          imageWidth: 24,
          imageHeight: 16,
          tileColors: [10, 11, 12, 13],
          tileCollisions: [20, 21, 22, 23],
          autotiles: [{ type: "2x2", startTile: 0 }],
          inode: "tiles1",
          _v: 0,
        },
        tiles2: {
          ...dummyTilesetResource,
          id: "tiles2",
          width: 2,
          height: 1,
          imageWidth: 16,
          imageHeight: 8,
          tileColors: [],
          tileCollisions: [],
          inode: "tiles2",
          _v: 0,
        },
      },
      ids: ["tiles1", "tiles2"],
    },
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          width: 2,
          height: 2,
          actors: [],
          triggers: [],
          collisions: [],
          tilemap: {
            tilesets: [
              { id: "tiles1", width: 2, height: 2 },
              { id: "tiles2", width: 2, height: 1 },
            ],
            autotiles: [{ type: "2x2", startTile: encodeSceneTileRef(0, 3) }],
            layers: [
              {
                id: "layer1",
                name: "Layer 1",
                visible: true,
                tiles: [
                  encodeSceneTileRef(0, 3),
                  encodeSceneTileRef(4, 1),
                  0,
                  0,
                ],
                autotiles: [1, 0, 0, 0],
              },
            ],
          },
        },
      },
      ids: ["scene1"],
    },
  };

  const resized = reducer(
    state,
    actions.loadTileset({
      data: {
        ...state.tilesets.entities.tiles1,
        _resourceType: "tileset",
        width: 3,
        height: 2,
        tileColors: "",
        tileCollisions: "",
      } as CompressedTilesetResourceAsset,
    }),
  );

  expect(resized.tilesets.entities.tiles1?.width).toBe(3);
  expect(resized.tilesets.entities.tiles1?.height).toBe(2);
  expect(resized.tilesets.entities.tiles1?.tileColors).toEqual([
    10,
    11,
    TILE_DEFAULT_UNSET,
    12,
    13,
    TILE_DEFAULT_UNSET,
  ]);
  expect(resized.tilesets.entities.tiles1?.tileCollisions).toEqual([
    20,
    21,
    TILE_DEFAULT_UNSET,
    22,
    23,
    TILE_DEFAULT_UNSET,
  ]);
  expect(resized.tilesets.entities.tiles1?.autotiles).toEqual([]);
  expect(resized.scenes.entities.scene1?.tilemap?.tilesets).toEqual([
    { id: "tiles1", width: 3, height: 2 },
    { id: "tiles2", width: 2, height: 1 },
  ]);
  expect(resized.scenes.entities.scene1?.tilemap?.layers[0]?.tiles).toEqual([
    encodeSceneTileRef(0, 4),
    encodeSceneTileRef(6, 1),
    0,
    0,
  ]);
  expect(resized.scenes.entities.scene1?.tilemap?.autotiles).toEqual([
    { type: "2x2", startTile: encodeSceneTileRef(0, 4) },
  ]);
  expect(resized.scenes.entities.scene1?.tilemap?.layers[0]?.autotiles).toEqual(
    [1, 0, 0, 0],
  );
});

test("Should automatically shrink a loaded tileset and clear cropped references", () => {
  const state: EntitiesState = {
    ...initialState,
    tilesets: {
      entities: {
        tiles1: {
          ...dummyTilesetResource,
          id: "tiles1",
          width: 3,
          height: 2,
          imageWidth: 16,
          imageHeight: 16,
          tileColors: [10, 11, 12, 13, 14, 15],
          tileCollisions: [20, 21, 22, 23, 24, 25],
          autotiles: [{ type: "2x2", startTile: 0 }],
          inode: "tiles1",
          _v: 0,
        },
        tiles2: {
          ...dummyTilesetResource,
          id: "tiles2",
          width: 2,
          height: 1,
          imageWidth: 16,
          imageHeight: 8,
          tileColors: [],
          tileCollisions: [],
          inode: "tiles2",
          _v: 0,
        },
      },
      ids: ["tiles1", "tiles2"],
    },
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          tilemap: {
            tilesets: [
              { id: "tiles1", width: 3, height: 2 },
              { id: "tiles2", width: 2, height: 1 },
            ],
            autotiles: [{ type: "2x2", startTile: encodeSceneTileRef(0, 5) }],
            layers: [
              {
                id: "layer1",
                name: "Layer 1",
                visible: true,
                tiles: [
                  encodeSceneTileRef(0, 4),
                  encodeSceneTileRef(0, 5),
                  encodeSceneTileRef(6, 1),
                ],
                autotiles: [1],
              },
            ],
          },
        },
      },
      ids: ["scene1"],
    },
  };

  const resized = reducer(
    state,
    actions.loadTileset({
      data: {
        ...state.tilesets.entities.tiles1,
        _resourceType: "tileset",
        width: 2,
        height: 2,
        tileColors: "",
        tileCollisions: "",
      } as CompressedTilesetResourceAsset,
    }),
  );

  expect(resized.tilesets.entities.tiles1).toMatchObject({
    width: 2,
    height: 2,
    tileColors: [10, 11, 13, 14],
    tileCollisions: [20, 21, 23, 24],
    autotiles: [],
  });
  expect(resized.scenes.entities.scene1?.tilemap?.layers[0]).toMatchObject({
    tiles: [encodeSceneTileRef(0, 3), 0, encodeSceneTileRef(4, 1)],
    autotiles: [1],
  });
  expect(resized.scenes.entities.scene1?.tilemap?.autotiles).toEqual([
    { type: "2x2", startTile: 0 },
  ]);
});

test("Should ignore invalid loaded tileset dimensions", () => {
  const state: EntitiesState = {
    ...initialState,
    tilesets: {
      entities: {
        tiles1: {
          ...dummyTilesetResource,
          id: "tiles1",
          width: 2,
          height: 2,
          imageWidth: 0,
          imageHeight: 0,
          tileColors: [1, 2, 3, 4],
          tileCollisions: [5, 6, 7, 8],
          inode: "tiles1",
          _v: 0,
        },
      },
      ids: ["tiles1"],
    },
  };

  const loaded = reducer(
    state,
    actions.loadTileset({
      data: {
        ...state.tilesets.entities.tiles1,
        _resourceType: "tileset",
        width: 0,
        height: 0,
        tileColors: "",
        tileCollisions: "",
      } as CompressedTilesetResourceAsset,
    }),
  );

  expect(loaded.tilesets.entities.tiles1).toMatchObject({
    width: 2,
    height: 2,
    tileColors: [1, 2, 3, 4],
    tileCollisions: [5, 6, 7, 8],
  });
});

test("Should not rewrite scene tilemaps when loaded dimensions are unchanged", () => {
  const state: EntitiesState = {
    ...initialState,
    tilesets: {
      entities: {
        tiles1: {
          ...dummyTilesetResource,
          id: "tiles1",
          width: 2,
          height: 2,
          imageWidth: 16,
          imageHeight: 16,
          tileColors: [],
          tileCollisions: [],
          inode: "tiles1",
          _v: 0,
        },
      },
      ids: ["tiles1"],
    },
  };

  const loaded = reducer(
    state,
    actions.loadTileset({
      data: {
        ...state.tilesets.entities.tiles1,
        _resourceType: "tileset",
        width: 2,
        height: 2,
        tileColors: "",
        tileCollisions: "",
      } as CompressedTilesetResourceAsset,
    }),
  );

  expect(loaded.scenes).toBe(state.scenes);
});

test("Should clamp automatically loaded tileset dimensions", () => {
  const state: EntitiesState = {
    ...initialState,
    tilesets: {
      entities: {
        tiles1: {
          ...dummyTilesetResource,
          id: "tiles1",
          width: 1,
          height: 1,
          imageWidth: 300 * TILE_SIZE,
          imageHeight: 300 * TILE_SIZE,
          tileColors: [],
          tileCollisions: [],
          inode: "tiles1",
          _v: 0,
        },
      },
      ids: ["tiles1"],
    },
  };

  const loaded = reducer(
    state,
    actions.loadTileset({
      data: {
        ...state.tilesets.entities.tiles1,
        _resourceType: "tileset",
        width: 255,
        height: 255,
        tileColors: "",
        tileCollisions: "",
      } as CompressedTilesetResourceAsset,
    }),
  );

  expect(loaded.tilesets.entities.tiles1).toMatchObject({
    width: 255,
    height: 255,
  });
});

/* eslint-disable camelcase */
import reducer, { initialState } from "store/features/entities/entitiesState";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import actions from "store/features/entities/entitiesActions";
import uuid from "uuid";
import {
  dummySceneNormalized,
  dummyBackground,
  dummyTilesetResource,
  dummyActorNormalized,
  dummyTriggerNormalized,
  dummyScriptEventNormalized,
} from "../../../../dummydata";
import {
  EVENT_SWITCH_SCENE,
  MAX_SCENE_TILE_COUNT,
  TILE_DEFAULT_UNSET,
  TILE_SIZE,
} from "consts";
import {
  buildSceneTilesetLookup,
  decodeSceneTileRef,
  encodeSceneTileRef,
  resolveSceneAutotiles,
} from "shared/lib/tiles/sceneTilemapData";
import { SceneTilemapData } from "shared/lib/resources/types";

jest.mock("uuid");
const mockUuid = uuid as jest.MockedFunction<typeof uuid>;

beforeEach(() => {
  let id = 0;
  mockUuid.mockImplementation(() => `uuid-${++id}`);
});

afterEach(() => {
  mockUuid.mockReset();
});

const tilesetSnapshot = (id: string, width = 256, height = 256) => ({
  id,
  width,
  height,
});

const decodeSceneRef = (
  tilemap: SceneTilemapData | undefined,
  value: number,
) => {
  if (!tilemap) {
    return undefined;
  }
  const tilesetLookup = buildSceneTilesetLookup(tilemap);

  return decodeSceneTileRef(value, tilesetLookup);
};

test("Should be able to add a scene", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const action = actions.addScene({
    x: 110,
    y: 220,
  });

  expect(state.scenes.ids.length).toBe(0);
  const newState = reducer(state, action);
  expect(newState.scenes.ids.length).toBe(1);
  expect(newState.scenes.entities[newState.scenes.ids[0] ?? ""]?.x).toBe(110);
  expect(newState.scenes.entities[newState.scenes.ids[0] ?? ""]?.y).toBe(220);
});

test("Should be able to add a tilemap scene", () => {
  const state: EntitiesState = { ...initialState };
  const newState = reducer(
    state,
    actions.addScene({ x: 110, y: 220, tilemap: true }),
  );
  const scene = newState.scenes.entities[newState.scenes.ids[0] ?? ""];

  expect(scene?.tilemap?.tilesets).toEqual([]);
  expect(scene?.tilemap?.tileColors).toHaveLength(
    (scene?.width ?? 0) * (scene?.height ?? 0),
  );
  expect(scene?.tilemap?.layers).toEqual([
    {
      id: "uuid-2",
      name: "Layer 1",
      visible: true,
      tiles: new Array((scene?.width ?? 0) * (scene?.height ?? 0)).fill(0),
    },
  ]);
});

const tilemapSceneState = (): EntitiesState => ({
  ...initialState,
  scenes: {
    entities: {
      scene1: {
        ...dummySceneNormalized,
        id: "scene1",
        width: 20,
        height: 18,
        actors: [],
        triggers: [],
        collisions: [],
      },
    },
    ids: ["scene1"],
  },
});

test("Should enable tilemap layers", () => {
  const newState = reducer(
    tilemapSceneState(),
    actions.setTilemapLayersEnabled({ sceneId: "scene1", enabled: true }),
  );
  const scene = newState.scenes.entities.scene1;

  expect(scene?.tilemap?.tilesets).toEqual([]);
  expect(scene?.tilemap?.tileColors).toHaveLength(20 * 18);
  expect(scene?.tilemap?.layers).toEqual([
    {
      id: "uuid-1",
      name: "Layer 1",
      visible: true,
      tiles: new Array(20 * 18).fill(0),
    },
  ]);
});

test("Should snapshot supplied tileset dimensions when enabling tilemap layers", () => {
  const state: EntitiesState = {
    ...tilemapSceneState(),
    tilesets: {
      entities: {
        tiles1: {
          ...dummyTilesetResource,
          id: "tiles1",
          width: 16,
          height: 12,
          inode: "tiles1",
          _v: 0,
        },
      },
      ids: ["tiles1"],
    },
  };
  const newState = reducer(
    state,
    actions.setTilemapLayersEnabled({
      sceneId: "scene1",
      enabled: true,
      tilesetId: "tiles1",
    }),
  );

  expect(newState.scenes.entities.scene1?.tilemap?.tilesets).toEqual([
    { id: "tiles1", width: 16, height: 12 },
  ]);
});

test("Should disable tilemap layers without changing unrelated scene fields", () => {
  const enabled = reducer(
    tilemapSceneState(),
    actions.setTilemapLayersEnabled({ sceneId: "scene1", enabled: true }),
  );
  const sceneBefore = enabled.scenes.entities.scene1;
  const disabled = reducer(
    enabled,
    actions.setTilemapLayersEnabled({ sceneId: "scene1", enabled: false }),
  );

  expect(disabled.scenes.entities.scene1).toEqual({
    ...sceneBefore,
    tilemap: undefined,
  });
});

test("Should add a tilemap layer", () => {
  const enabled = reducer(
    tilemapSceneState(),
    actions.setTilemapLayersEnabled({ sceneId: "scene1", enabled: true }),
  );
  const newState = reducer(
    enabled,
    actions.addTilemapLayer({ sceneId: "scene1" }),
  );

  expect(newState.scenes.entities.scene1?.tilemap?.layers[1]).toEqual({
    id: "uuid-2",
    name: "Layer 2",
    visible: true,
    tiles: new Array(20 * 18).fill(0),
  });
});

test("Should edit a tilemap layer name and visibility", () => {
  const enabled = reducer(
    tilemapSceneState(),
    actions.setTilemapLayersEnabled({ sceneId: "scene1", enabled: true }),
  );
  const newState = reducer(
    enabled,
    actions.editTilemapLayer({
      sceneId: "scene1",
      layerId: "uuid-1",
      changes: { name: "Roof", visible: false },
    }),
  );

  expect(newState.scenes.entities.scene1?.tilemap?.layers[0]).toMatchObject({
    name: "Roof",
    visible: false,
  });
});

test("Should move a tilemap layer to the bottom and top", () => {
  const enabled = reducer(
    tilemapSceneState(),
    actions.setTilemapLayersEnabled({ sceneId: "scene1", enabled: true }),
  );
  const withLayer = reducer(
    enabled,
    actions.addTilemapLayer({ sceneId: "scene1" }),
  );
  const movedToBottom = reducer(
    withLayer,
    actions.moveTilemapLayer({
      sceneId: "scene1",
      layerId: "uuid-2",
      direction: "bottom",
    }),
  );
  expect(
    movedToBottom.scenes.entities.scene1?.tilemap?.layers.map(({ id }) => id),
  ).toEqual(["uuid-2", "uuid-1"]);

  const movedToTop = reducer(
    movedToBottom,
    actions.moveTilemapLayer({
      sceneId: "scene1",
      layerId: "uuid-2",
      direction: "top",
    }),
  );
  expect(
    movedToTop.scenes.entities.scene1?.tilemap?.layers.map(({ id }) => id),
  ).toEqual(["uuid-1", "uuid-2"]);
});

test("Should remove a tilemap layer while preserving at least one layer", () => {
  const enabled = reducer(
    tilemapSceneState(),
    actions.setTilemapLayersEnabled({ sceneId: "scene1", enabled: true }),
  );
  const withLayer = reducer(
    enabled,
    actions.addTilemapLayer({ sceneId: "scene1" }),
  );
  const removed = reducer(
    withLayer,
    actions.removeTilemapLayer({ sceneId: "scene1", layerId: "uuid-2" }),
  );
  expect(removed.scenes.entities.scene1?.tilemap?.layers).toHaveLength(1);

  const unchanged = reducer(
    removed,
    actions.removeTilemapLayer({ sceneId: "scene1", layerId: "uuid-1" }),
  );
  expect(unchanged).toBe(removed);
});

test("Should move tilemap layers up, top, and bottom", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          backgroundId: "",
          width: 4,
          height: 3,
          actors: [],
          triggers: [],
          tilemap: {
            tilesets: [],
            tileColors: new Array(12).fill(0),
            layers: [
              {
                id: "layer1",
                name: "Layer 1",
                visible: true,
                tiles: new Array(12).fill(1),
              },
              {
                id: "layer2",
                name: "Layer 2",
                visible: true,
                tiles: new Array(12).fill(2),
              },
              {
                id: "layer3",
                name: "Layer 3",
                visible: true,
                tiles: new Array(12).fill(3),
              },
            ],
          },
        },
      },
      ids: ["scene1"],
    },
  };

  const movedUp = reducer(
    state,
    actions.moveTilemapLayer({
      sceneId: "scene1",
      layerId: "layer1",
      direction: 1,
    }),
  );
  expect(
    movedUp.scenes.entities.scene1?.tilemap?.layers.map((layer) => layer.id),
  ).toEqual(["layer2", "layer1", "layer3"]);

  const movedTop = reducer(
    state,
    actions.moveTilemapLayer({
      sceneId: "scene1",
      layerId: "layer1",
      direction: "top",
    }),
  );
  expect(
    movedTop.scenes.entities.scene1?.tilemap?.layers.map((layer) => layer.id),
  ).toEqual(["layer2", "layer3", "layer1"]);

  const movedBottom = reducer(
    movedTop,
    actions.moveTilemapLayer({
      sceneId: "scene1",
      layerId: "layer1",
      direction: "bottom",
    }),
  );
  expect(
    movedBottom.scenes.entities.scene1?.tilemap?.layers.map(
      (layer) => layer.id,
    ),
  ).toEqual(["layer1", "layer2", "layer3"]);
});
test("Should not move a missing tilemap layer", () => {
  const enabled = reducer(
    tilemapSceneState(),
    actions.setTilemapLayersEnabled({ sceneId: "scene1", enabled: true }),
  );
  const unchanged = reducer(
    enabled,
    actions.moveTilemapLayer({
      sceneId: "scene1",
      layerId: "missing",
      direction: "top",
    }),
  );

  expect(unchanged).toBe(enabled);
});

test("Should resize and shift painted scene layers", () => {
  const enabled = reducer(
    tilemapSceneState(),
    actions.setTilemapLayersEnabled({ sceneId: "scene1", enabled: true }),
  );
  const scene = enabled.scenes.entities.scene1;
  if (!scene?.tilemap) throw new Error("Expected tilemap scene");
  const tiles = new Array(20 * 18).fill(0);
  const tileColors = new Array(20 * 18).fill(0);
  const collisions = new Array(20 * 18).fill(0);
  tiles[2 * 20 + 2] = 7;
  tileColors[2 * 20 + 2] = 3;
  collisions[2 * 20 + 2] = 4;
  const painted: EntitiesState = {
    ...enabled,
    scenes: {
      ...enabled.scenes,
      entities: {
        ...enabled.scenes.entities,
        scene1: {
          ...scene,
          collisions,
          tilemap: {
            ...scene.tilemap,
            tileColors,
            layers: [{ ...scene.tilemap.layers[0], tiles }],
          },
        },
      },
    },
  };

  const expanded = reducer(
    painted,
    actions.resizeTilemapLayers({
      sceneId: "scene1",
      width: 21,
      height: 18,
      resizeAxis: "width",
    }),
  );
  expect(
    expanded.scenes.entities.scene1?.tilemap?.layers[0]?.tiles,
  ).toHaveLength(21 * 18);
  expect(
    expanded.scenes.entities.scene1?.tilemap?.layers[0]?.tiles[2 * 21 + 2],
  ).toBe(7);
  expect(
    expanded.scenes.entities.scene1?.tilemap?.tileColors?.[2 * 21 + 2],
  ).toBe(3);
  expect(expanded.scenes.entities.scene1?.collisions[2 * 21 + 2]).toBe(4);

  const cropped = reducer(
    expanded,
    actions.resizeTilemapLayers({
      sceneId: "scene1",
      width: 20,
      height: 18,
      shiftX: -1,
      resizeAxis: "width",
    }),
  );
  expect(
    cropped.scenes.entities.scene1?.tilemap?.layers[0]?.tiles[2 * 20 + 1],
  ).toBe(7);
  expect(
    cropped.scenes.entities.scene1?.tilemap?.tileColors?.[2 * 20 + 1],
  ).toBe(3);
  expect(cropped.scenes.entities.scene1?.collisions[2 * 20 + 1]).toBe(4);
  expect(cropped.scenes.entities.scene1?.x).toBe((scene.x ?? 0) + TILE_SIZE);
  expect(cropped.scenes.entities.scene1?.y).toBe(scene.y);
});

test("Should resize and shift painted scene layers vertically", () => {
  const enabled = reducer(
    tilemapSceneState(),
    actions.setTilemapLayersEnabled({ sceneId: "scene1", enabled: true }),
  );
  const scene = enabled.scenes.entities.scene1;
  if (!scene?.tilemap) throw new Error("Expected tilemap scene");
  const tiles = new Array(20 * 18).fill(0);
  const tileColors = new Array(20 * 18).fill(0);
  const collisions = new Array(20 * 18).fill(0);
  tiles[2 * 20 + 2] = 7;
  tileColors[2 * 20 + 2] = 3;
  collisions[2 * 20 + 2] = 4;
  const painted: EntitiesState = {
    ...enabled,
    scenes: {
      ...enabled.scenes,
      entities: {
        ...enabled.scenes.entities,
        scene1: {
          ...scene,
          collisions,
          tilemap: {
            ...scene.tilemap,
            tileColors,
            layers: [{ ...scene.tilemap.layers[0], tiles }],
          },
        },
      },
    },
  };

  const expanded = reducer(
    painted,
    actions.resizeTilemapLayers({
      sceneId: "scene1",
      width: 20,
      height: 19,
      resizeAxis: "height",
    }),
  );
  expect(
    expanded.scenes.entities.scene1?.tilemap?.layers[0]?.tiles,
  ).toHaveLength(20 * 19);
  expect(
    expanded.scenes.entities.scene1?.tilemap?.layers[0]?.tiles[2 * 20 + 2],
  ).toBe(7);

  const cropped = reducer(
    expanded,
    actions.resizeTilemapLayers({
      sceneId: "scene1",
      width: 20,
      height: 18,
      shiftY: -1,
      resizeAxis: "height",
    }),
  );
  expect(
    cropped.scenes.entities.scene1?.tilemap?.layers[0]?.tiles[1 * 20 + 2],
  ).toBe(7);
  expect(
    cropped.scenes.entities.scene1?.tilemap?.tileColors?.[1 * 20 + 2],
  ).toBe(3);
  expect(cropped.scenes.entities.scene1?.collisions[1 * 20 + 2]).toBe(4);
  expect(cropped.scenes.entities.scene1?.x).toBe(scene.x);
  expect(cropped.scenes.entities.scene1?.y).toBe((scene.y ?? 0) + TILE_SIZE);
});

test("Should limit tilemap scene width to the maximum tile count", () => {
  const enabled = reducer(
    tilemapSceneState(),
    actions.setTilemapLayersEnabled({ sceneId: "scene1", enabled: true }),
  );
  const resized = reducer(
    enabled,
    actions.resizeTilemapLayers({
      sceneId: "scene1",
      width: 208,
      height: 100,
      resizeAxis: "width",
    }),
  );
  const scene = resized.scenes.entities.scene1;

  expect(scene?.width).toBe(163);
  expect(scene?.height).toBe(100);
  expect((scene?.width ?? 0) * (scene?.height ?? 0)).toBeLessThanOrEqual(
    MAX_SCENE_TILE_COUNT,
  );
});

test("Should limit tilemap scene height to the maximum tile count", () => {
  const enabled = reducer(
    tilemapSceneState(),
    actions.setTilemapLayersEnabled({ sceneId: "scene1", enabled: true }),
  );
  const resized = reducer(
    enabled,
    actions.resizeTilemapLayers({
      sceneId: "scene1",
      width: 208,
      height: 100,
      resizeAxis: "height",
    }),
  );
  const scene = resized.scenes.entities.scene1;

  expect(scene?.width).toBe(208);
  expect(scene?.height).toBe(78);
  expect((scene?.width ?? 0) * (scene?.height ?? 0)).toBeLessThanOrEqual(
    MAX_SCENE_TILE_COUNT,
  );
});

test("Should preserve and re-resolve autotiles when resizing", () => {
  const enabled = reducer(
    tilemapSceneState(),
    actions.setTilemapLayersEnabled({ sceneId: "scene1", enabled: true }),
  );
  const scene = enabled.scenes.entities.scene1;
  if (!scene?.tilemap) throw new Error("Expected tilemap scene");
  const base = encodeSceneTileRef(0, 0);
  const autotiles = new Array(20 * 18).fill(0);
  autotiles[1] = base;
  autotiles[2] = base;
  const withAutotiles: EntitiesState = {
    ...enabled,
    scenes: {
      ...enabled.scenes,
      entities: {
        ...enabled.scenes.entities,
        scene1: {
          ...scene,
          tilemap: {
            ...scene.tilemap,
            tilesets: [{ id: "tiles", width: 8, height: 20 }],
            layers: [{ ...scene.tilemap.layers[0], autotiles }],
          },
        },
      },
    },
  };

  const resized = reducer(
    withAutotiles,
    actions.resizeTilemapLayers({
      sceneId: "scene1",
      width: 20,
      height: 18,
      shiftX: -1,
      resizeAxis: "width",
    }),
  );
  const resizedScene = resized.scenes.entities.scene1;
  const layer = resizedScene?.tilemap?.layers[0];
  expect(layer?.autotiles?.[0]).toBe(base);
  expect(layer?.autotiles?.[1]).toBe(base);
  expect(layer?.tiles).toEqual(
    resolveSceneAutotiles(
      layer?.autotiles ?? [],
      20,
      18,
      resizedScene?.tilemap ?? { tilesets: [] },
    ),
  );
});

test("Should shift and clamp actors, triggers, and switch-scene coordinates", () => {
  const state = tilemapSceneState();
  const scene = state.scenes.entities.scene1;
  if (!scene) throw new Error("Expected scene");
  scene.actors = ["actor1"];
  scene.triggers = ["trigger1"];
  state.actors = {
    ids: ["actor1"],
    entities: {
      actor1: { ...dummyActorNormalized, id: "actor1", x: 19, y: 17 },
    },
  };
  state.triggers = {
    ids: ["trigger1"],
    entities: {
      trigger1: {
        ...dummyTriggerNormalized,
        id: "trigger1",
        x: 18,
        y: 16,
        width: 4,
        height: 4,
      },
    },
  };
  state.scriptEvents = {
    ids: ["event1", "event2"],
    entities: {
      event1: {
        ...dummyScriptEventNormalized,
        id: "event1",
        command: EVENT_SWITCH_SCENE,
        args: {
          sceneId: "scene1",
          x: { type: "number", value: 1 },
          y: { type: "variable", value: "0" },
        },
      },
      event2: {
        ...dummyScriptEventNormalized,
        id: "event2",
        command: EVENT_SWITCH_SCENE,
        args: {
          sceneId: "otherScene",
          x: { type: "number", value: 7 },
          y: { type: "number", value: 8 },
        },
      },
    },
  };
  const enabled = reducer(
    state,
    actions.setTilemapLayersEnabled({ sceneId: "scene1", enabled: true }),
  );
  const resized = reducer(
    enabled,
    actions.resizeTilemapLayers({
      sceneId: "scene1",
      width: 20,
      height: 18,
      shiftX: -5,
      shiftY: 3,
      resizeAxis: "width",
    }),
  );

  expect(resized.actors.entities.actor1).toMatchObject({ x: 14, y: 17 });
  expect(resized.triggers.entities.trigger1).toMatchObject({
    x: 13,
    y: 17,
    width: 4,
    height: 1,
  });
  expect(resized.scriptEvents.entities.event1?.args).toMatchObject({
    x: { type: "number", value: 0 },
    y: { type: "variable", value: "0" },
  });
  expect(resized.scriptEvents.entities.event2?.args).toMatchObject({
    x: { type: "number", value: 7 },
    y: { type: "number", value: 8 },
  });
});

test("Should not shift actors or triggers when resizing from right or bottom", () => {
  const state = tilemapSceneState();
  const scene = state.scenes.entities.scene1;
  if (!scene) throw new Error("Expected scene");
  scene.actors = ["actor1"];
  scene.triggers = ["trigger1"];
  state.actors = {
    ids: ["actor1"],
    entities: {
      actor1: { ...dummyActorNormalized, id: "actor1", x: 5, y: 6 },
    },
  };
  state.triggers = {
    ids: ["trigger1"],
    entities: {
      trigger1: {
        ...dummyTriggerNormalized,
        id: "trigger1",
        x: 7,
        y: 8,
        width: 2,
        height: 3,
      },
    },
  };
  const enabled = reducer(
    state,
    actions.setTilemapLayersEnabled({ sceneId: "scene1", enabled: true }),
  );
  const resized = reducer(
    enabled,
    actions.resizeTilemapLayers({
      sceneId: "scene1",
      width: 21,
      height: 19,
      resizeAxis: "width",
    }),
  );

  expect(resized.actors.entities.actor1).toMatchObject({ x: 5, y: 6 });
  expect(resized.triggers.entities.trigger1).toMatchObject({
    x: 7,
    y: 8,
    width: 2,
    height: 3,
  });
});

test("Should update scene dimensions to match new background", () => {
  const state: EntitiesState = {
    ...initialState,
    tilesets: {
      entities: {
        tiles1: {
          ...dummyTilesetResource,
          id: "tiles1",
          width: 4,
          height: 8,
          imageWidth: 32,
          imageHeight: 64,
          tileColors: [],
          tileCollisions: [],
          inode: "tiles1",
          _v: 0,
        },
      },
      ids: ["tiles1"],
    },
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          backgroundId: "bg1",
          width: 20,
          height: 18,
          actors: [],
          triggers: [],
          collisions: [1, 2, 3],
        },
      },
      ids: ["scene1"],
    },
    backgrounds: {
      entities: {
        bg1: {
          ...dummyBackground,
          id: "bg1",
          width: 20,
          height: 18,
        },
        bg2: {
          ...dummyBackground,
          id: "bg2",
          width: 32,
          height: 28,
        },
      },
      ids: ["bg1", "bg2"],
    },
  };

  const action = actions.editScene({
    sceneId: "scene1",
    changes: {
      backgroundId: "bg2",
    },
  });

  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.width).toEqual(32);
  expect(newState.scenes.entities["scene1"]?.height).toEqual(28);
});

test("Should discard collisions if switched to use different background of different width", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          backgroundId: "bg1",
          actors: [],
          triggers: [],
          collisions: [1, 2, 3],
        },
      },
      ids: ["scene1"],
    },
    backgrounds: {
      entities: {
        bg1: {
          ...dummyBackground,
          id: "bg1",
          width: 3,
        },
        bg2: {
          ...dummyBackground,
          id: "bg2",
          width: 4,
          height: 2,
        },
      },
      ids: ["bg1", "bg2"],
    },
  };

  const action = actions.editScene({
    sceneId: "scene1",
    changes: {
      backgroundId: "bg2",
    },
  });

  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.collisions).toEqual([
    0, 0, 0, 0, 0, 0, 0, 0,
  ]);
});

test("Should be able to remove a scene", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          actors: [],
          triggers: [],
        },
      },
      ids: ["scene1"],
    },
  };

  const action = actions.removeScene({
    sceneId: "scene1",
  });

  expect(state.scenes.ids.length).toBe(1);
  const newState = reducer(state, action);
  expect(newState.scenes.ids.length).toBe(0);
});

test("Should be able to flood fill collisions", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          backgroundId: "bg1",
          width: 10,
          height: 5,
          actors: [],
          triggers: [],
        },
      },
      ids: ["scene1"],
    },
    backgrounds: {
      entities: {
        bg1: {
          ...dummyBackground,
          id: "bg1",
          width: 10,
          height: 5,
        },
      },
      ids: ["bg1"],
    },
  };

  const action = actions.paintCollision({
    sceneId: "scene1",
    x: 0,
    y: 0,
    value: 2,
    brush: "fill",
    mask: 0x0f,
    drawLine: false,
    tileLookup: [],
  });

  const newState = reducer(state, action);

  const expectedCols = Array.from(Array(50)).map((_i) => 2);

  expect(newState.scenes.entities["scene1"]?.collisions.length).toBe(50);
  expect(newState.scenes.entities["scene1"]?.collisions).toEqual(expectedCols);
});

test("Should be able to paint collisions", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          backgroundId: "bg1",
          width: 10,
          height: 5,
          actors: [],
          triggers: [],
        },
      },
      ids: ["scene1"],
    },
    backgrounds: {
      entities: {
        bg1: {
          ...dummyBackground,
          id: "bg1",
          width: 10,
          height: 5,
        },
      },
      ids: ["bg1"],
    },
  };

  const action = actions.paintCollision({
    sceneId: "scene1",
    x: 5,
    y: 0,
    value: 2,
    brush: "8px",
    mask: 0x0f,
    drawLine: false,
    tileLookup: [],
  });

  const newState = reducer(state, action);

  const expectedCols = Array.from(Array(50)).map((i, index) => {
    if (index === 5) {
      return 2;
    }
    return 0;
  });

  expect(newState.scenes.entities["scene1"]?.collisions.length).toBe(50);
  expect(newState.scenes.entities["scene1"]?.collisions).toEqual(expectedCols);
});

test("Should be able to paint collision line", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          backgroundId: "bg1",
          width: 10,
          height: 5,
          actors: [],
          triggers: [],
        },
      },
      ids: ["scene1"],
    },
    backgrounds: {
      entities: {
        bg1: {
          ...dummyBackground,
          id: "bg1",
          width: 10,
          height: 5,
        },
      },
      ids: ["bg1"],
    },
  };

  const action = actions.paintCollision({
    sceneId: "scene1",
    x: 0,
    y: 0,
    endX: 5,
    endY: 5,
    value: 2,
    brush: "8px",
    mask: 0x0f,
    drawLine: true,
    tileLookup: [],
  });

  const newState = reducer(state, action);

  const expectedCols = Array.from(Array(50)).map((i, index) => {
    if (index % 10 === Math.floor(index / 10)) {
      return 2;
    }
    return 0;
  });

  expect(newState.scenes.entities["scene1"]?.collisions.length).toBe(50);
  expect(newState.scenes.entities["scene1"]?.collisions).toEqual(expectedCols);
});

test("Should enable, paint, and resize a painted scene", () => {
  mockUuid.mockReturnValue("layer1");
  const state: EntitiesState = {
    ...initialState,
    tilesets: {
      entities: {
        tiles1: {
          ...dummyTilesetResource,
          id: "tiles1",
          inode: "tiles1",
          _v: 0,
        },
      },
      ids: ["tiles1"],
    },
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          width: 20,
          height: 18,
          actors: [],
          triggers: [],
          collisions: [],
        },
      },
      ids: ["scene1"],
    },
  };
  const enabled = reducer(
    state,
    actions.setTilemapLayersEnabled({ sceneId: "scene1", enabled: true }),
  );
  const painted = reducer(
    enabled,
    actions.paintSceneTile({
      sceneId: "scene1",
      layerId: "layer1",
      tilesetId: "tiles1",
      tileIndex: 42,
      x: 2,
      y: 3,
    }),
  );
  const scene = painted.scenes.entities.scene1;
  expect(scene?.tilemap?.tilesets).toEqual([tilesetSnapshot("tiles1")]);
  expect(
    decodeSceneRef(
      scene?.tilemap,
      scene?.tilemap?.layers[0]?.tiles[3 * 20 + 2] ?? 0,
    ),
  ).toEqual(
    expect.objectContaining({
      tilesetIndex: 0,
      tileIndex: 42,
      tilesetId: "tiles1",
    }),
  );
  const collisionPainted = reducer(
    painted,
    actions.paintCollision({
      sceneId: "scene1",
      x: 2,
      y: 3,
      value: 1,
      brush: "8px",
      mask: 0xff,
    }),
  );
  const colorPainted = reducer(
    collisionPainted,
    actions.paintColor({
      sceneId: "scene1",
      backgroundId: "",
      x: 2,
      y: 3,
      paletteIndex: 3,
      brush: "8px",
      isTileProp: false,
    }),
  );
  const movedSelection = reducer(
    colorPainted,
    actions.moveSceneTileSelection({
      sceneId: "scene1",
      layerId: "layer1",
      selection: { x: 2, y: 3, width: 1, height: 1 },
      offset: { x: 2, y: 2 },
    }),
  );
  expect(
    movedSelection.scenes.entities.scene1?.tilemap?.layers[0]?.tiles[
      3 * 20 + 2
    ],
  ).toBe(0);
  expect(
    decodeSceneRef(
      movedSelection.scenes.entities.scene1?.tilemap,
      movedSelection.scenes.entities.scene1?.tilemap?.layers[0]?.tiles[
        5 * 20 + 4
      ] ?? 0,
    ),
  ).toEqual(
    expect.objectContaining({
      tilesetIndex: 0,
      tileIndex: 42,
      tilesetId: "tiles1",
    }),
  );
  expect(movedSelection.scenes.entities.scene1?.collisions[3 * 20 + 2]).toBe(0);
  expect(movedSelection.scenes.entities.scene1?.collisions[5 * 20 + 4]).toBe(1);
  expect(
    movedSelection.scenes.entities.scene1?.tilemap?.tileColors?.[3 * 20 + 2],
  ).toBe(0);
  expect(
    movedSelection.scenes.entities.scene1?.tilemap?.tileColors?.[5 * 20 + 4],
  ).toBe(3);
  const deletedTileSelection = reducer(
    movedSelection,
    actions.deleteSceneTileSelection({
      sceneId: "scene1",
      layerId: "layer1",
      selection: { x: 4, y: 5, width: 1, height: 1 },
    }),
  );
  expect(
    deletedTileSelection.scenes.entities.scene1?.tilemap?.layers[0]?.tiles[
      5 * 20 + 4
    ],
  ).toBe(0);
  const movedCollisionSelection = reducer(
    movedSelection,
    actions.moveSceneCollisionSelection({
      sceneId: "scene1",
      selection: { x: 4, y: 5, width: 1, height: 1 },
      offset: { x: 1, y: 0 },
    }),
  );
  expect(
    movedCollisionSelection.scenes.entities.scene1?.collisions[5 * 20 + 4],
  ).toBe(0);
  expect(
    movedCollisionSelection.scenes.entities.scene1?.collisions[5 * 20 + 5],
  ).toBe(1);
  const colored = reducer(
    movedCollisionSelection,
    actions.paintColor({
      sceneId: "scene1",
      backgroundId: "",
      x: 4,
      y: 5,
      paletteIndex: 3,
      brush: "8px",
      isTileProp: false,
    }),
  );
  const movedColorSelection = reducer(
    colored,
    actions.moveSceneColorSelection({
      sceneId: "scene1",
      selection: { x: 4, y: 5, width: 1, height: 1 },
      offset: { x: 1, y: 0 },
    }),
  );
  expect(
    movedColorSelection.scenes.entities.scene1?.tilemap?.tileColors?.[
      5 * 20 + 4
    ],
  ).toBe(0);
  expect(
    movedColorSelection.scenes.entities.scene1?.tilemap?.tileColors?.[
      5 * 20 + 5
    ],
  ).toBe(3);
  const deletedColorSelection = reducer(
    movedColorSelection,
    actions.deleteSceneColorSelection({
      sceneId: "scene1",
      selection: { x: 5, y: 5, width: 1, height: 1 },
    }),
  );
  expect(
    deletedColorSelection.scenes.entities.scene1?.tilemap?.tileColors?.[
      5 * 20 + 5
    ],
  ).toBe(0);
  expect(
    deletedColorSelection.scenes.entities.scene1?.collisions[5 * 20 + 5],
  ).toBe(1);
  const deletedCollisionSelection = reducer(
    movedCollisionSelection,
    actions.deleteSceneCollisionSelection({
      sceneId: "scene1",
      selection: { x: 5, y: 5, width: 1, height: 1 },
    }),
  );
  expect(
    deletedCollisionSelection.scenes.entities.scene1?.collisions[5 * 20 + 5],
  ).toBe(0);

  const resized = reducer(
    painted,
    actions.resizeTilemapLayers({
      sceneId: "scene1",
      width: 21,
      height: 19,
      resizeAxis: "width",
    }),
  );
  expect(
    resized.scenes.entities.scene1?.tilemap?.layers[0]?.tiles,
  ).toHaveLength(21 * 19);

  const cropped = reducer(
    resized,
    actions.resizeTilemapLayers({
      sceneId: "scene1",
      width: 20,
      height: 19,
      resizeAxis: "width",
      shiftX: -1,
    }),
  );
  expect(
    decodeSceneRef(
      cropped.scenes.entities.scene1?.tilemap,
      cropped.scenes.entities.scene1?.tilemap?.layers[0]?.tiles[3 * 20 + 1] ??
        0,
    ),
  ).toEqual(
    expect.objectContaining({
      tilesetIndex: 0,
      tileIndex: 42,
      tilesetId: "tiles1",
    }),
  );

  mockUuid.mockReturnValue("layer2");
  const withLayer = reducer(
    cropped,
    actions.addTilemapLayer({ sceneId: "scene1" }),
  );
  expect(withLayer.scenes.entities.scene1?.tilemap?.layers[1]?.id).toBe(
    "layer2",
  );
  const hidden = reducer(
    withLayer,
    actions.editTilemapLayer({
      sceneId: "scene1",
      layerId: "layer2",
      changes: { name: "Roof", visible: false },
    }),
  );
  expect(hidden.scenes.entities.scene1?.tilemap?.layers[1]).toMatchObject({
    name: "Roof",
    visible: false,
  });
  const movedToBottom = reducer(
    hidden,
    actions.moveTilemapLayer({
      sceneId: "scene1",
      layerId: "layer2",
      direction: "bottom",
    }),
  );
  expect(movedToBottom.scenes.entities.scene1?.tilemap?.layers[0]?.id).toBe(
    "layer2",
  );
  const movedToTop = reducer(
    movedToBottom,
    actions.moveTilemapLayer({
      sceneId: "scene1",
      layerId: "layer2",
      direction: "top",
    }),
  );
  expect(movedToTop.scenes.entities.scene1?.tilemap?.layers[1]?.id).toBe(
    "layer2",
  );
  const removed = reducer(
    movedToTop,
    actions.removeTilemapLayer({ sceneId: "scene1", layerId: "layer2" }),
  );
  expect(removed.scenes.entities.scene1?.tilemap?.layers).toHaveLength(1);
});

test("Should delete color selections from image backgrounds", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          backgroundId: "bg1",
          width: 2,
          height: 2,
          actors: [],
          triggers: [],
        },
      },
      ids: ["scene1"],
    },
    backgrounds: {
      entities: {
        bg1: {
          ...dummyBackground,
          id: "bg1",
          width: 2,
          height: 2,
          tileColors: [1, 2, 3, 4],
        },
      },
      ids: ["bg1"],
    },
  };
  const deleted = reducer(
    state,
    actions.deleteSceneColorSelection({
      sceneId: "scene1",
      selection: { x: 1, y: 0, width: 1, height: 2 },
    }),
  );
  expect(deleted.backgrounds.entities.bg1?.tileColors).toEqual([1, 0, 3, 0]);
});

test("Should limit painted scenes to the maximum tile count", () => {
  const width = 208;
  const height = 78;
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          width,
          height,
          actors: [],
          triggers: [],
          collisions: [],
          tilemap: {
            tilesets: [],
            tileColors: [],
            layers: [
              {
                id: "layer1",
                name: "Layer 1",
                visible: true,
                tiles: [],
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
    actions.resizeTilemapLayers({
      sceneId: "scene1",
      width,
      height: 100,
      resizeAxis: "height",
    }),
  );
  const scene = resized.scenes.entities.scene1;

  expect(scene?.width).toBe(208);
  expect(scene?.height).toBe(78);
  expect((scene?.width ?? 0) * (scene?.height ?? 0)).toBeLessThanOrEqual(
    MAX_SCENE_TILE_COUNT,
  );
});

test("Should preserve unchanged tile default arrays while painting", () => {
  const collisions = [0, 0, 0, 0];
  const tileColors = [0, 0, 0, 0];
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          width: 2,
          height: 2,
          actors: [],
          triggers: [],
          collisions,
          tilemap: {
            tilesets: [tilesetSnapshot("tiles1")],
            tileColors,
            layers: [
              {
                id: "layer1",
                name: "Layer 1",
                visible: true,
                tiles: [0, 0, 0, 0],
              },
            ],
          },
        },
      },
      ids: ["scene1"],
    },
    tilesets: {
      entities: {
        tiles1: {
          ...dummyTilesetResource,
          id: "tiles1",
          width: 1,
          height: 1,
          imageWidth: 8,
          imageHeight: 8,
          tileColors: [TILE_DEFAULT_UNSET],
          tileCollisions: [TILE_DEFAULT_UNSET],
          inode: "tiles1",
          _v: 0,
        },
      },
      ids: ["tiles1"],
    },
  };

  const painted = reducer(
    state,
    actions.paintSceneTile({
      sceneId: "scene1",
      layerId: "layer1",
      tilesetId: "tiles1",
      tileIndex: 0,
      x: 0,
      y: 0,
    }),
  );

  expect(painted.scenes.entities.scene1?.collisions).toBe(collisions);
  expect(painted.scenes.entities.scene1?.tilemap?.tileColors).toBe(tileColors);
});

test("Should distinguish unset tile defaults from explicit zero defaults", () => {
  const createState = (defaultValue: number): EntitiesState => ({
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          width: 1,
          height: 1,
          actors: [],
          triggers: [],
          collisions: [0x0f],
          tilemap: {
            tilesets: [tilesetSnapshot("tiles1")],
            tileColors: [3],
            layers: [
              {
                id: "layer1",
                name: "Layer 1",
                visible: true,
                tiles: [0],
              },
            ],
          },
        },
      },
      ids: ["scene1"],
    },
    tilesets: {
      entities: {
        tiles1: {
          ...dummyTilesetResource,
          id: "tiles1",
          width: 1,
          height: 1,
          imageWidth: 8,
          imageHeight: 8,
          tileColors: [defaultValue],
          tileCollisions: [defaultValue],
          inode: "tiles1",
          _v: 0,
        },
      },
      ids: ["tiles1"],
    },
  });
  const paint = (state: EntitiesState) =>
    reducer(
      state,
      actions.paintSceneTile({
        sceneId: "scene1",
        layerId: "layer1",
        tilesetId: "tiles1",
        tileIndex: 0,
        x: 0,
        y: 0,
      }),
    ).scenes.entities.scene1;

  const unset = paint(createState(TILE_DEFAULT_UNSET));
  expect(unset?.tilemap?.tileColors).toEqual([3]);
  expect(unset?.collisions).toEqual([0x0f]);

  const explicitZero = paint(createState(0));
  expect(explicitZero?.tilemap?.tileColors).toEqual([0]);
  expect(explicitZero?.collisions).toEqual([0]);
});

test("Should copy tile default arrays only when defaults change", () => {
  const collisions = [0x0f, 0, 0, 0];
  const tileColors = [0, 0, 0, 0];
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          width: 2,
          height: 2,
          actors: [],
          triggers: [],
          collisions,
          tilemap: {
            tilesets: [tilesetSnapshot("tiles1")],
            tileColors,
            layers: [
              {
                id: "layer1",
                name: "Layer 1",
                visible: true,
                tiles: [0, 0, 0, 0],
              },
            ],
          },
        },
      },
      ids: ["scene1"],
    },
    tilesets: {
      entities: {
        tiles1: {
          ...dummyTilesetResource,
          id: "tiles1",
          width: 1,
          height: 1,
          imageWidth: 8,
          imageHeight: 8,
          tileColors: [3],
          tileCollisions: [0],
          inode: "tiles1",
          _v: 0,
        },
      },
      ids: ["tiles1"],
    },
  };

  const painted = reducer(
    state,
    actions.paintSceneTile({
      sceneId: "scene1",
      layerId: "layer1",
      tilesetId: "tiles1",
      tileIndex: 0,
      x: 0,
      y: 0,
    }),
  );

  expect(painted.scenes.entities.scene1?.collisions).not.toBe(collisions);
  expect(painted.scenes.entities.scene1?.collisions[0]).toBe(0);
  expect(painted.scenes.entities.scene1?.tilemap?.tileColors).not.toBe(
    tileColors,
  );
  expect(painted.scenes.entities.scene1?.tilemap?.tileColors?.[0]).toBe(3);
});

test("Should update neighbouring RPG-style autotiles when painting and erasing", () => {
  mockUuid.mockReturnValue("layer1");
  const state: EntitiesState = {
    ...initialState,
    tilesets: {
      entities: {
        tiles1: {
          ...dummyTilesetResource,
          id: "tiles1",
          width: 4,
          height: 8,
          imageWidth: 32,
          imageHeight: 64,
          tileColors: [],
          tileCollisions: [],
          inode: "tiles1",
          _v: 0,
        },
      },
      ids: ["tiles1"],
    },
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          width: 20,
          height: 18,
          actors: [],
          triggers: [],
          collisions: [],
        },
      },
      ids: ["scene1"],
    },
  };
  let painted = reducer(
    state,
    actions.setTilemapLayersEnabled({ sceneId: "scene1", enabled: true }),
  );
  const paint = (x: number, y: number, tileIndex = 10) => {
    painted = reducer(
      painted,
      actions.paintSceneTile({
        sceneId: "scene1",
        layerId: "layer1",
        tilesetId: "tiles1",
        tileIndex,
        autotile: true,
        x,
        y,
      }),
    );
  };
  paint(5, 5);
  paint(6, 5);
  paint(5, 6);
  paint(6, 6);
  const layer = painted.scenes.entities.scene1?.tilemap?.layers[0];
  expect(
    decodeSceneRef(
      painted.scenes.entities.scene1?.tilemap,
      layer?.tiles[5 * 20 + 5] ?? 0,
    )?.tileIndex,
  ).toBe(23);
  expect(
    decodeSceneRef(
      painted.scenes.entities.scene1?.tilemap,
      layer?.tiles[5 * 20 + 6] ?? 0,
    )?.tileIndex,
  ).toBe(10);
  expect(
    decodeSceneRef(
      painted.scenes.entities.scene1?.tilemap,
      layer?.tiles[6 * 20 + 5] ?? 0,
    )?.tileIndex,
  ).toBe(18);
  expect(
    decodeSceneRef(
      painted.scenes.entities.scene1?.tilemap,
      layer?.tiles[6 * 20 + 6] ?? 0,
    )?.tileIndex,
  ).toBe(25);
  expect(layer?.autotiles?.[5 * 20 + 5]).toBe(layer?.autotiles?.[5 * 20 + 6]);

  paint(6, 5, -1);
  const erasedLayer = painted.scenes.entities.scene1?.tilemap?.layers[0];
  expect(
    decodeSceneRef(
      painted.scenes.entities.scene1?.tilemap,
      erasedLayer?.tiles[5 * 20 + 5] ?? 0,
    )?.tileIndex,
  ).toBe(22);
  expect(erasedLayer?.tiles[5 * 20 + 6]).toBe(0);
});

test.each([false, true])(
  "Should paint every tile in a fast dragged line (autotile: %s)",
  (autotile) => {
    mockUuid.mockReturnValue("layer1");
    const state: EntitiesState = {
      ...initialState,
      tilesets: {
        entities: {
          tiles1: {
            ...dummyTilesetResource,
            id: "tiles1",
            width: 4,
            height: 8,
            imageWidth: 32,
            imageHeight: 64,
            tileColors: [],
            tileCollisions: [],
            inode: "tiles1",
            _v: 0,
          },
        },
        ids: ["tiles1"],
      },
      scenes: {
        entities: {
          scene1: {
            ...dummySceneNormalized,
            id: "scene1",
            width: 20,
            height: 18,
            actors: [],
            triggers: [],
            collisions: [],
          },
        },
        ids: ["scene1"],
      },
    };
    const enabled = reducer(
      state,
      actions.setTilemapLayersEnabled({ sceneId: "scene1", enabled: true }),
    );
    const painted = reducer(
      enabled,
      actions.paintSceneTile({
        sceneId: "scene1",
        layerId: "layer1",
        tilesetId: "tiles1",
        tileIndex: 10,
        autotile,
        x: 2,
        y: 4,
        endX: 8,
        endY: 4,
        drawLine: true,
      }),
    );
    const layer = painted.scenes.entities.scene1?.tilemap?.layers[0];
    for (let x = 2; x <= 8; x++) {
      expect(layer?.tiles[4 * 20 + x]).not.toBe(0);
      expect(Boolean(layer?.autotiles?.[4 * 20 + x])).toBe(autotile);
    }
  },
);

test("Should paint tilemaps with a 16px brush", () => {
  mockUuid.mockReturnValue("layer1");
  const state: EntitiesState = {
    ...initialState,
    tilesets: {
      entities: {
        tiles1: {
          ...dummyTilesetResource,
          id: "tiles1",
          inode: "tiles1",
          _v: 0,
        },
      },
      ids: ["tiles1"],
    },
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          width: 20,
          height: 18,
          actors: [],
          triggers: [],
          collisions: [],
        },
      },
      ids: ["scene1"],
    },
  };
  const enabled = reducer(
    state,
    actions.setTilemapLayersEnabled({ sceneId: "scene1", enabled: true }),
  );
  const painted = reducer(
    enabled,
    actions.paintSceneTile({
      sceneId: "scene1",
      layerId: "layer1",
      tilesetId: "tiles1",
      tileIndex: 10,
      brush: "16px",
      x: 2,
      y: 3,
    }),
  );
  const tiles = painted.scenes.entities.scene1?.tilemap?.layers[0]?.tiles ?? [];
  expect([
    tiles[3 * 20 + 2],
    tiles[3 * 20 + 3],
    tiles[4 * 20 + 2],
    tiles[4 * 20 + 3],
  ]).toEqual([11, 11, 11, 11]);
});

test("Should paint a rectangular tile selection as a stamp", () => {
  mockUuid.mockReturnValue("layer1");
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          width: 20,
          height: 18,
          actors: [],
          triggers: [],
          collisions: [],
        },
      },
      ids: ["scene1"],
    },
    tilesets: {
      entities: {
        tiles1: {
          ...dummyTilesetResource,
          id: "tiles1",
          width: 4,
          height: 4,
          imageWidth: 32,
          imageHeight: 32,
          tileColors: [0xff, 0xff, 0xff, 0xff, 0xff, 3, 0x80, 0xff, 0xff, 5, 6],
          tileCollisions: [0, 0, 0, 0, 0, 0x0f, 0x01, 0, 0, 0x02, 0x04],
          inode: "tiles1",
          _v: 0,
        },
      },
      ids: ["tiles1"],
    },
  };
  const enabled = reducer(
    state,
    actions.setTilemapLayersEnabled({ sceneId: "scene1", enabled: true }),
  );
  const painted = reducer(
    enabled,
    actions.paintSceneTile({
      sceneId: "scene1",
      layerId: "layer1",
      tilesetId: "tiles1",
      tileIndex: 5,
      stamp: { width: 2, height: 2, tilesetWidth: 4 },
      x: 2,
      y: 3,
    }),
  );
  const tiles = painted.scenes.entities.scene1?.tilemap?.layers[0]?.tiles ?? [];
  expect([
    decodeSceneRef(
      painted.scenes.entities.scene1?.tilemap,
      tiles[3 * 20 + 2] ?? 0,
    )?.tileIndex,
    decodeSceneRef(
      painted.scenes.entities.scene1?.tilemap,
      tiles[3 * 20 + 3] ?? 0,
    )?.tileIndex,
    decodeSceneRef(
      painted.scenes.entities.scene1?.tilemap,
      tiles[4 * 20 + 2] ?? 0,
    )?.tileIndex,
    decodeSceneRef(
      painted.scenes.entities.scene1?.tilemap,
      tiles[4 * 20 + 3] ?? 0,
    )?.tileIndex,
  ]).toEqual([5, 6, 9, 10]);
  const tileColors = painted.scenes.entities.scene1?.tilemap?.tileColors ?? [];
  expect([
    tileColors[3 * 20 + 2],
    tileColors[3 * 20 + 3],
    tileColors[4 * 20 + 2],
    tileColors[4 * 20 + 3],
  ]).toEqual([3, 0x80, 5, 6]);
  const collisions = painted.scenes.entities.scene1?.collisions ?? [];
  expect([
    collisions[3 * 20 + 2],
    collisions[3 * 20 + 3],
    collisions[4 * 20 + 2],
    collisions[4 * 20 + 3],
  ]).toEqual([0x0f, 0x01, 0x02, 0x04]);

  const erased = reducer(
    painted,
    actions.paintSceneTile({
      sceneId: "scene1",
      layerId: "layer1",
      tilesetId: "tiles1",
      tileIndex: 5,
      stamp: { width: 2, height: 2, tilesetWidth: 4 },
      brush: "8px",
      erase: true,
      x: 2,
      y: 3,
    }),
  );
  const erasedTiles =
    erased.scenes.entities.scene1?.tilemap?.layers[0]?.tiles ?? [];
  expect(erasedTiles[3 * 20 + 2]).toBe(0);
  expect(erasedTiles[3 * 20 + 3]).not.toBe(0);
  expect(erasedTiles[4 * 20 + 2]).not.toBe(0);
});

test("Should repeat a stamp when filling from the clicked position", () => {
  const target = encodeSceneTileRef(0, 0);
  const barrier = encodeSceneTileRef(0, 1);
  const sourceTiles = new Array(5 * 4).fill(target);
  sourceTiles[0] = barrier;
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          width: 5,
          height: 4,
          actors: [],
          triggers: [],
          collisions: [],
          tilemap: {
            tilesets: [tilesetSnapshot("tiles1")],
            tileColors: [],
            layers: [
              {
                id: "layer1",
                name: "Layer 1",
                visible: true,
                tiles: sourceTiles,
              },
            ],
          },
        },
      },
      ids: ["scene1"],
    },
  };

  const painted = reducer(
    state,
    actions.paintSceneTile({
      sceneId: "scene1",
      layerId: "layer1",
      tilesetId: "tiles1",
      tileIndex: 5,
      stamp: { width: 2, height: 2, tilesetWidth: 4 },
      brush: "fill",
      x: 1,
      y: 1,
    }),
  );
  const tiles = painted.scenes.entities.scene1?.tilemap?.layers[0]?.tiles ?? [];
  const tileIndexAt = (x: number, y: number) =>
    decodeSceneRef(
      painted.scenes.entities.scene1?.tilemap,
      tiles[y * 5 + x] ?? 0,
    )?.tileIndex;

  expect(tileIndexAt(0, 0)).toBe(1);
  expect(tileIndexAt(1, 1)).toBe(5);
  expect(tileIndexAt(2, 1)).toBe(6);
  expect(tileIndexAt(1, 2)).toBe(9);
  expect(tileIndexAt(2, 2)).toBe(10);
  expect(tileIndexAt(4, 3)).toBe(6);
});

test("Should paint palette and priority attributes on painted scene tiles", () => {
  const tiles = new Array(20 * 18).fill(0);
  tiles[0] = 1;
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          backgroundId: "",
          width: 20,
          height: 18,
          actors: [],
          triggers: [],
          tilemap: {
            tilesets: [tilesetSnapshot("tiles")],
            tileColors: new Array(20 * 18).fill(0),
            layers: [
              {
                id: "layer1",
                name: "Layer",
                visible: true,
                tiles,
              },
            ],
          },
        },
      },
      ids: ["scene1"],
    },
  };
  const colored = reducer(
    state,
    actions.paintColor({
      sceneId: "scene1",
      backgroundId: "",
      x: 0,
      y: 0,
      paletteIndex: 3,
      brush: "8px",
      isTileProp: false,
    }),
  );
  const prioritized = reducer(
    colored,
    actions.paintColor({
      sceneId: "scene1",
      backgroundId: "",
      x: 0,
      y: 0,
      paletteIndex: 0x80,
      brush: "8px",
      isTileProp: true,
    }),
  );
  const attrs = prioritized.scenes.entities.scene1?.tilemap?.tileColors ?? [];
  expect(attrs[0]).toBe(0x83);
  expect(attrs[1]).toBe(0);
});

test("Should contextually erase painted tiles, collisions, and color attributes", () => {
  const tiles = new Array(20 * 18).fill(0);
  tiles[0] = encodeSceneTileRef(0, 4);
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          backgroundId: "",
          width: 20,
          height: 18,
          actors: [],
          triggers: [],
          collisions: [0xff],
          tilemap: {
            tilesets: [tilesetSnapshot("tiles")],
            tileColors: [0x83],
            layers: [
              {
                id: "layer1",
                name: "Layer",
                visible: true,
                tiles,
              },
            ],
          },
        },
      },
      ids: ["scene1"],
    },
  };
  const withoutTile = reducer(
    state,
    actions.paintSceneTile({
      sceneId: "scene1",
      layerId: "layer1",
      tilesetId: "tiles",
      tileIndex: 10,
      brush: "16px",
      erase: true,
      x: 0,
      y: 0,
    }),
  );
  const withoutCollision = reducer(
    withoutTile,
    actions.paintCollision({
      sceneId: "scene1",
      x: 0,
      y: 0,
      value: 0,
      mask: 0xff,
      brush: "16px",
    }),
  );
  const erased = reducer(
    withoutCollision,
    actions.paintColor({
      sceneId: "scene1",
      backgroundId: "",
      x: 0,
      y: 0,
      paletteIndex: 0,
      isTileProp: false,
      brush: "16px",
      erase: true,
    }),
  );
  const scene = erased.scenes.entities.scene1;
  expect(scene?.tilemap?.layers[0]?.tiles[0]).toBe(0);
  expect(scene?.collisions[0]).toBe(0);
  expect(scene?.tilemap?.tileColors?.[0]).toBe(0);
});

test("Should magic paint matching tiles on painted scene collision and color maps", () => {
  const tileLookup = [1, 2, 1, 3];
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          backgroundId: "",
          width: 2,
          height: 2,
          actors: [],
          triggers: [],
          collisions: [0, 0, 0, 0],
          tilemap: {
            tilesets: [tilesetSnapshot("tiles")],
            tileColors: [0, 0, 0, 0],
            layers: [
              {
                id: "layer1",
                name: "Layer",
                visible: true,
                tiles: tileLookup,
              },
            ],
          },
        },
      },
      ids: ["scene1"],
    },
  };

  const collisionPainted = reducer(
    state,
    actions.paintCollision({
      sceneId: "scene1",
      tileLookup,
      x: 0,
      y: 0,
      value: 0x0f,
      brush: "magic",
      mask: 0xff,
    }),
  );
  expect(collisionPainted.scenes.entities.scene1?.collisions).toEqual([
    0x0f, 0, 0x0f, 0,
  ]);

  const colorPainted = reducer(
    collisionPainted,
    actions.paintColor({
      sceneId: "scene1",
      backgroundId: "",
      tileLookup,
      x: 0,
      y: 0,
      paletteIndex: 3,
      brush: "magic",
      isTileProp: false,
    }),
  );
  expect(colorPainted.scenes.entities.scene1?.tilemap?.tileColors).toEqual([
    3, 0, 3, 0,
  ]);
});

test("Should magic paint matching tiles on image scene collision and color maps", () => {
  const tileLookup = [1, 2, 1, 3];
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          backgroundId: "bg1",
          width: 2,
          height: 2,
          actors: [],
          triggers: [],
          collisions: [0, 0, 0, 0],
        },
      },
      ids: ["scene1"],
    },
    backgrounds: {
      entities: {
        bg1: {
          ...dummyBackground,
          id: "bg1",
          width: 2,
          height: 2,
          tileColors: [0, 0, 0, 0],
        },
      },
      ids: ["bg1"],
    },
  };

  const collisionPainted = reducer(
    state,
    actions.paintCollision({
      sceneId: "scene1",
      tileLookup,
      x: 0,
      y: 0,
      value: 0x0f,
      brush: "magic",
      mask: 0xff,
    }),
  );
  expect(collisionPainted.scenes.entities.scene1?.collisions).toEqual([
    0x0f, 0, 0x0f, 0,
  ]);

  const colorPainted = reducer(
    collisionPainted,
    actions.paintColor({
      sceneId: "scene1",
      backgroundId: "bg1",
      tileLookup,
      x: 0,
      y: 0,
      paletteIndex: 3,
      brush: "magic",
      isTileProp: false,
    }),
  );
  expect(colorPainted.backgrounds.entities.bg1?.tileColors).toEqual([
    3, 0, 3, 0,
  ]);
});

test("Should not apply tile defaults when painting behind a visible higher layer", () => {
  const collisions = [0x0f];
  const tileColors = [2];

  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          width: 1,
          height: 1,
          actors: [],
          triggers: [],
          collisions,
          tilemap: {
            tilesets: [tilesetSnapshot("tiles1")],
            tileColors,
            layers: [
              {
                id: "lower",
                name: "Lower",
                visible: true,
                tiles: [0],
              },
              {
                id: "upper",
                name: "Upper",
                visible: true,
                tiles: [encodeSceneTileRef(0, 1)],
              },
            ],
          },
        },
      },
      ids: ["scene1"],
    },
    tilesets: {
      entities: {
        tiles1: {
          ...dummyTilesetResource,
          id: "tiles1",
          width: 2,
          height: 1,
          imageWidth: 16,
          imageHeight: 8,
          tileColors: [3, 4],
          tileCollisions: [0x01, 0x02],
          inode: "tiles1",
          _v: 0,
        },
      },
      ids: ["tiles1"],
    },
  };

  const painted = reducer(
    state,
    actions.paintSceneTile({
      sceneId: "scene1",
      layerId: "lower",
      tilesetId: "tiles1",
      tileIndex: 0,
      x: 0,
      y: 0,
    }),
  );

  expect(painted.scenes.entities.scene1?.tilemap?.layers[0]?.tiles[0]).toBe(
    encodeSceneTileRef(0, 0),
  );
  expect(painted.scenes.entities.scene1?.tilemap?.tileColors).toBe(tileColors);
  expect(painted.scenes.entities.scene1?.collisions).toBe(collisions);
});

test("Should apply tile defaults when painting the top visible layer", () => {
  const collisions = [0x0f];
  const tileColors = [2];

  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          width: 1,
          height: 1,
          actors: [],
          triggers: [],
          collisions,
          tilemap: {
            tilesets: [tilesetSnapshot("tiles1")],
            tileColors,
            layers: [
              {
                id: "lower",
                name: "Lower",
                visible: true,
                tiles: [encodeSceneTileRef(0, 1)],
              },
              {
                id: "upper",
                name: "Upper",
                visible: true,
                tiles: [0],
              },
            ],
          },
        },
      },
      ids: ["scene1"],
    },
    tilesets: {
      entities: {
        tiles1: {
          ...dummyTilesetResource,
          id: "tiles1",
          width: 2,
          height: 1,
          imageWidth: 16,
          imageHeight: 8,
          tileColors: [3, 4],
          tileCollisions: [0x01, 0x02],
          inode: "tiles1",
          _v: 0,
        },
      },
      ids: ["tiles1"],
    },
  };

  const painted = reducer(
    state,
    actions.paintSceneTile({
      sceneId: "scene1",
      layerId: "upper",
      tilesetId: "tiles1",
      tileIndex: 0,
      x: 0,
      y: 0,
    }),
  );

  expect(painted.scenes.entities.scene1?.tilemap?.layers[1]?.tiles[0]).toBe(
    encodeSceneTileRef(0, 0),
  );
  expect(painted.scenes.entities.scene1?.tilemap?.tileColors).toEqual([3]);
  expect(painted.scenes.entities.scene1?.collisions).toEqual([0x01]);

  expect(painted.scenes.entities.scene1?.tilemap?.tileColors).not.toBe(
    tileColors,
  );
  expect(painted.scenes.entities.scene1?.collisions).not.toBe(collisions);
});

test("Should move linked colors and collisions when moving topmost scene tiles", () => {
  const a = encodeSceneTileRef(0, 0);
  const b = encodeSceneTileRef(0, 1);
  const collisions = [0x01, 0x02, 0x03];
  const tileColors = [1, 2, 3];

  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          width: 3,
          height: 1,
          actors: [],
          triggers: [],
          collisions,
          tilemap: {
            tilesets: [tilesetSnapshot("tiles1")],
            tileColors,
            layers: [
              {
                id: "layer1",
                name: "Layer 1",
                visible: true,
                tiles: [a, b, 0],
              },
              {
                id: "layer2",
                name: "Layer 2",
                visible: true,
                tiles: [0, 0, 0],
              },
            ],
          },
        },
      },
      ids: ["scene1"],
    },
  };

  const moved = reducer(
    state,
    actions.moveSceneTileSelection({
      sceneId: "scene1",
      layerId: "layer1",
      selection: { x: 0, y: 0, width: 1, height: 1 },
      offset: { x: 2, y: 0 },
    }),
  );

  expect(moved.scenes.entities.scene1?.tilemap?.layers[0]?.tiles).toEqual([
    0,
    b,
    a,
  ]);
  expect(moved.scenes.entities.scene1?.collisions).toEqual([0, 0x02, 0x01]);
  expect(moved.scenes.entities.scene1?.tilemap?.tileColors).toEqual([0, 2, 1]);
});

test("Should not move linked colors and collisions when selected scene tile is hidden by a higher layer", () => {
  const lowerTile = encodeSceneTileRef(0, 0);
  const upperTile = encodeSceneTileRef(0, 1);
  const collisions = [0x01, 0x02, 0x03];
  const tileColors = [1, 2, 3];

  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          width: 3,
          height: 1,
          actors: [],
          triggers: [],
          collisions,
          tilemap: {
            tilesets: [tilesetSnapshot("tiles1")],
            tileColors,
            layers: [
              {
                id: "layer1",
                name: "Layer 1",
                visible: true,
                tiles: [lowerTile, 0, 0],
              },
              {
                id: "layer2",
                name: "Layer 2",
                visible: true,
                tiles: [upperTile, 0, 0],
              },
            ],
          },
        },
      },
      ids: ["scene1"],
    },
  };

  const moved = reducer(
    state,
    actions.moveSceneTileSelection({
      sceneId: "scene1",
      layerId: "layer1",
      selection: { x: 0, y: 0, width: 1, height: 1 },
      offset: { x: 1, y: 0 },
    }),
  );

  expect(moved.scenes.entities.scene1?.tilemap?.layers[0]?.tiles).toEqual([
    0,
    lowerTile,
    0,
  ]);
  expect(moved.scenes.entities.scene1?.tilemap?.layers[1]?.tiles).toEqual([
    upperTile,
    0,
    0,
  ]);
  expect(moved.scenes.entities.scene1?.collisions).toEqual(collisions);
  expect(moved.scenes.entities.scene1?.tilemap?.tileColors).toEqual(tileColors);
});

test("Should not replace linked colors and collisions when moved scene tile is hidden at destination", () => {
  const lowerTile = encodeSceneTileRef(0, 0);
  const upperTile = encodeSceneTileRef(0, 1);
  const collisions = [0x01, 0x02, 0x03];
  const tileColors = [1, 2, 3];

  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          width: 3,
          height: 1,
          actors: [],
          triggers: [],
          collisions,
          tilemap: {
            tilesets: [tilesetSnapshot("tiles1")],
            tileColors,
            layers: [
              {
                id: "layer1",
                name: "Layer 1",
                visible: true,
                tiles: [lowerTile, 0, 0],
              },
              {
                id: "layer2",
                name: "Layer 2",
                visible: true,
                tiles: [0, upperTile, 0],
              },
            ],
          },
        },
      },
      ids: ["scene1"],
    },
  };

  const moved = reducer(
    state,
    actions.moveSceneTileSelection({
      sceneId: "scene1",
      layerId: "layer1",
      selection: { x: 0, y: 0, width: 1, height: 1 },
      offset: { x: 1, y: 0 },
    }),
  );

  expect(moved.scenes.entities.scene1?.tilemap?.layers[0]?.tiles).toEqual([
    0,
    lowerTile,
    0,
  ]);
  expect(moved.scenes.entities.scene1?.tilemap?.layers[1]?.tiles).toEqual([
    0,
    upperTile,
    0,
  ]);
  expect(moved.scenes.entities.scene1?.collisions).toEqual([0, 0x02, 0x03]);
  expect(moved.scenes.entities.scene1?.tilemap?.tileColors).toEqual([0, 2, 3]);
});

describe("tilemap collision and color painting legacy coverage", () => {
  test("Should paint collision on a tilemap scene without a background", () => {
    const state: EntitiesState = {
      ...initialState,
      scenes: {
        entities: {
          scene1: {
            ...dummySceneNormalized,
            id: "scene1",
            backgroundId: "",
            width: 4,
            height: 3,
            actors: [],
            triggers: [],
            collisions: [],
            tilemap: {
              tilesets: [],
              tileColors: new Array(12).fill(0),
              layers: [
                {
                  id: "layer1",
                  name: "Layer 1",
                  visible: true,
                  tiles: new Array(12).fill(0),
                },
              ],
            },
          },
        },
        ids: ["scene1"],
      },
    };

    const newState = reducer(
      state,
      actions.paintCollision({
        sceneId: "scene1",
        x: 2,
        y: 1,
        value: 7,
        brush: "8px",
        mask: 0xff,
        drawLine: false,
        tileLookup: [],
      }),
    );

    expect(newState.scenes.entities.scene1?.collisions).toEqual([
      0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 0, 0,
    ]);
  });

  test("Should paint slope collision on a tilemap scene without a background", () => {
    const state: EntitiesState = {
      ...initialState,
      scenes: {
        entities: {
          scene1: {
            ...dummySceneNormalized,
            id: "scene1",
            backgroundId: "",
            width: 4,
            height: 1,
            actors: [],
            triggers: [],
            collisions: [],
            tilemap: {
              tilesets: [],
              tileColors: new Array(4).fill(0),
              layers: [
                {
                  id: "layer1",
                  name: "Layer 1",
                  visible: true,
                  tiles: new Array(4).fill(0),
                },
              ],
            },
          },
        },
        ids: ["scene1"],
      },
    };

    const newState = reducer(
      state,
      actions.paintSlopeCollision({
        sceneId: "scene1",
        startX: 0,
        startY: 0,
        endX: 3,
        endY: 0,
        offset: false,
        slopeIncline: "medium",
        slopeDirection: "right",
      }),
    );

    const collisions = newState.scenes.entities.scene1?.collisions ?? [];
    expect(collisions).toHaveLength(4);
    expect(collisions[0]).not.toBe(0);
    expect(collisions.slice(0, 3)).toEqual([
      collisions[0],
      collisions[0],
      collisions[0],
    ]);
    expect(collisions[3]).toBe(0);
  });

  test("Should erase color attributes on a tilemap scene", () => {
    const state: EntitiesState = {
      ...initialState,
      scenes: {
        entities: {
          scene1: {
            ...dummySceneNormalized,
            id: "scene1",
            backgroundId: "",
            width: 2,
            height: 2,
            actors: [],
            triggers: [],
            tilemap: {
              tilesets: [],
              tileColors: [0x83, 2, 3, 4],
              layers: [
                {
                  id: "layer1",
                  name: "Layer 1",
                  visible: true,
                  tiles: new Array(4).fill(0),
                },
              ],
            },
          },
        },
        ids: ["scene1"],
      },
    };

    const newState = reducer(
      state,
      actions.paintColor({
        sceneId: "scene1",
        backgroundId: "",
        x: 0,
        y: 0,
        paletteIndex: 0,
        brush: "8px",
        isTileProp: false,
        erase: true,
      }),
    );

    expect(newState.scenes.entities.scene1?.tilemap?.tileColors).toEqual([
      0, 2, 3, 4,
    ]);
  });
});

describe("moveSceneCollisionSelection", () => {
  test("Should be able to move a collision selection", () => {
    const state: EntitiesState = {
      ...initialState,
      scenes: {
        entities: {
          scene1: {
            ...dummySceneNormalized,
            id: "scene1",
            backgroundId: "bg1",
            width: 4,
            height: 3,
            collisions: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            actors: [],
            triggers: [],
          },
        },
        ids: ["scene1"],
      },
      backgrounds: {
        entities: {
          bg1: {
            ...dummyBackground,
            id: "bg1",
            width: 4,
            height: 3,
          },
        },
        ids: ["bg1"],
      },
    };

    const action = actions.moveSceneCollisionSelection({
      sceneId: "scene1",
      selection: { x: 0, y: 0, width: 2, height: 2 },
      offset: { x: 1, y: 1 },
    });

    const newState = reducer(state, action);

    expect(newState.scenes.entities["scene1"]?.collisions).toEqual([
      0, 0, 3, 4, 0, 1, 2, 8, 9, 5, 6, 12,
    ]);
  });

  test("Should not mutate the original collision array", () => {
    const collisions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    const state: EntitiesState = {
      ...initialState,
      scenes: {
        entities: {
          scene1: {
            ...dummySceneNormalized,
            id: "scene1",
            backgroundId: "bg1",
            width: 4,
            height: 3,
            collisions,
            actors: [],
            triggers: [],
          },
        },
        ids: ["scene1"],
      },
      backgrounds: {
        entities: {},
        ids: [],
      },
    };

    const action = actions.moveSceneCollisionSelection({
      sceneId: "scene1",
      selection: { x: 0, y: 0, width: 2, height: 2 },
      offset: { x: 1, y: 1 },
    });

    reducer(state, action);

    expect(collisions).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  test("Should do nothing if scene does not exist", () => {
    const state: EntitiesState = {
      ...initialState,
    };

    const action = actions.moveSceneCollisionSelection({
      sceneId: "missing",
      selection: { x: 0, y: 0, width: 1, height: 1 },
      offset: { x: 1, y: 1 },
    });

    const newState = reducer(state, action);

    expect(newState).toEqual(state);
  });
});

describe("deleteSceneCollisionSelection", () => {
  test("Should be able to delete a collision selection", () => {
    const state: EntitiesState = {
      ...initialState,
      scenes: {
        entities: {
          scene1: {
            ...dummySceneNormalized,
            id: "scene1",
            backgroundId: "bg1",
            width: 4,
            height: 3,
            collisions: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            actors: [],
            triggers: [],
          },
        },
        ids: ["scene1"],
      },
      backgrounds: {
        entities: {},
        ids: [],
      },
    };

    const action = actions.deleteSceneCollisionSelection({
      sceneId: "scene1",
      selection: { x: 1, y: 1, width: 2, height: 2 },
    });

    const newState = reducer(state, action);

    expect(newState.scenes.entities["scene1"]?.collisions).toEqual([
      1, 2, 3, 4, 5, 0, 0, 8, 9, 0, 0, 12,
    ]);
  });

  test("Should clip collision selections that extend outside the scene", () => {
    const state: EntitiesState = {
      ...initialState,
      scenes: {
        entities: {
          scene1: {
            ...dummySceneNormalized,
            id: "scene1",
            backgroundId: "bg1",
            width: 4,
            height: 3,
            collisions: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            actors: [],
            triggers: [],
          },
        },
        ids: ["scene1"],
      },
      backgrounds: {
        entities: {},
        ids: [],
      },
    };

    const action = actions.deleteSceneCollisionSelection({
      sceneId: "scene1",
      selection: { x: 2, y: 1, width: 4, height: 4 },
    });

    const newState = reducer(state, action);

    expect(newState.scenes.entities["scene1"]?.collisions).toEqual([
      1, 2, 3, 4, 5, 6, 0, 0, 9, 10, 0, 0,
    ]);
  });
});

describe("moveSceneColorSelection", () => {
  test("Should be able to move a color selection on an image scene", () => {
    const state: EntitiesState = {
      ...initialState,
      scenes: {
        entities: {
          scene1: {
            ...dummySceneNormalized,
            id: "scene1",
            backgroundId: "bg1",
            width: 4,
            height: 3,
            actors: [],
            triggers: [],
          },
        },
        ids: ["scene1"],
      },
      backgrounds: {
        entities: {
          bg1: {
            ...dummyBackground,
            id: "bg1",
            width: 4,
            height: 3,
            tileColors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          },
        },
        ids: ["bg1"],
      },
    };

    const action = actions.moveSceneColorSelection({
      sceneId: "scene1",
      selection: { x: 0, y: 0, width: 2, height: 2 },
      offset: { x: 1, y: 1 },
    });

    const newState = reducer(state, action);

    expect(newState.backgrounds.entities["bg1"]?.tileColors).toEqual([
      0, 0, 3, 4, 0, 1, 2, 8, 9, 5, 6, 12,
    ]);
  });

  test("Should be able to move a color selection on a tilemap scene", () => {
    const collisions = [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9];

    const state: EntitiesState = {
      ...initialState,
      scenes: {
        entities: {
          scene1: {
            ...dummySceneNormalized,
            id: "scene1",
            backgroundId: "",
            width: 4,
            height: 3,
            collisions,
            actors: [],
            triggers: [],
            tilemap: {
              tilesets: [],
              tileColors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
              layers: [
                {
                  id: "layer1",
                  name: "Layer 1",
                  visible: true,
                  tiles: new Array(12).fill(0),
                },
              ],
            },
          },
        },
        ids: ["scene1"],
      },
      backgrounds: {
        entities: {},
        ids: [],
      },
    };

    const action = actions.moveSceneColorSelection({
      sceneId: "scene1",
      selection: { x: 0, y: 0, width: 2, height: 2 },
      offset: { x: 1, y: 1 },
    });

    const newState = reducer(state, action);

    expect(newState.scenes.entities["scene1"]?.tilemap?.tileColors).toEqual([
      0, 0, 3, 4, 0, 1, 2, 8, 9, 5, 6, 12,
    ]);
    expect(newState.scenes.entities["scene1"]?.collisions).toEqual(collisions);
  });

  test("Should not change scene collisions when moving a color selection", () => {
    const collisions = [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9];

    const state: EntitiesState = {
      ...initialState,
      scenes: {
        entities: {
          scene1: {
            ...dummySceneNormalized,
            id: "scene1",
            backgroundId: "bg1",
            width: 4,
            height: 3,
            collisions,
            actors: [],
            triggers: [],
          },
        },
        ids: ["scene1"],
      },
      backgrounds: {
        entities: {
          bg1: {
            ...dummyBackground,
            id: "bg1",
            width: 4,
            height: 3,
            tileColors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          },
        },
        ids: ["bg1"],
      },
    };

    const action = actions.moveSceneColorSelection({
      sceneId: "scene1",
      selection: { x: 0, y: 0, width: 2, height: 2 },
      offset: { x: 1, y: 1 },
    });

    const newState = reducer(state, action);

    expect(newState.scenes.entities["scene1"]?.collisions).toEqual(collisions);
  });

  test("Should do nothing if scene background does not exist", () => {
    const state: EntitiesState = {
      ...initialState,
      scenes: {
        entities: {
          scene1: {
            ...dummySceneNormalized,
            id: "scene1",
            backgroundId: "missing",
            width: 4,
            height: 3,
            actors: [],
            triggers: [],
          },
        },
        ids: ["scene1"],
      },
      backgrounds: {
        entities: {},
        ids: [],
      },
    };

    const action = actions.moveSceneColorSelection({
      sceneId: "scene1",
      selection: { x: 0, y: 0, width: 2, height: 2 },
      offset: { x: 1, y: 1 },
    });

    const newState = reducer(state, action);

    expect(newState).toEqual(state);
  });
});

describe("deleteSceneColorSelection", () => {
  test("Should be able to delete a color selection on an image scene", () => {
    const state: EntitiesState = {
      ...initialState,
      scenes: {
        entities: {
          scene1: {
            ...dummySceneNormalized,
            id: "scene1",
            backgroundId: "bg1",
            width: 4,
            height: 3,
            actors: [],
            triggers: [],
          },
        },
        ids: ["scene1"],
      },
      backgrounds: {
        entities: {
          bg1: {
            ...dummyBackground,
            id: "bg1",
            width: 4,
            height: 3,
            tileColors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          },
        },
        ids: ["bg1"],
      },
    };

    const action = actions.deleteSceneColorSelection({
      sceneId: "scene1",
      selection: { x: 1, y: 1, width: 2, height: 2 },
    });

    const newState = reducer(state, action);

    expect(newState.backgrounds.entities["bg1"]?.tileColors).toEqual([
      1, 2, 3, 4, 5, 0, 0, 8, 9, 0, 0, 12,
    ]);
  });

  test("Should be able to delete a color selection on a tilemap scene", () => {
    const collisions = [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9];

    const state: EntitiesState = {
      ...initialState,
      scenes: {
        entities: {
          scene1: {
            ...dummySceneNormalized,
            id: "scene1",
            backgroundId: "",
            width: 4,
            height: 3,
            collisions,
            actors: [],
            triggers: [],
            tilemap: {
              tilesets: [],
              tileColors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
              layers: [
                {
                  id: "layer1",
                  name: "Layer 1",
                  visible: true,
                  tiles: new Array(12).fill(0),
                },
              ],
            },
          },
        },
        ids: ["scene1"],
      },
      backgrounds: {
        entities: {},
        ids: [],
      },
    };

    const action = actions.deleteSceneColorSelection({
      sceneId: "scene1",
      selection: { x: 1, y: 1, width: 2, height: 2 },
    });

    const newState = reducer(state, action);

    expect(newState.scenes.entities["scene1"]?.tilemap?.tileColors).toEqual([
      1, 2, 3, 4, 5, 0, 0, 8, 9, 0, 0, 12,
    ]);
    expect(newState.scenes.entities["scene1"]?.collisions).toEqual(collisions);
  });

  test("Should not change scene collisions when deleting a color selection", () => {
    const collisions = [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9];

    const state: EntitiesState = {
      ...initialState,
      scenes: {
        entities: {
          scene1: {
            ...dummySceneNormalized,
            id: "scene1",
            backgroundId: "bg1",
            width: 4,
            height: 3,
            collisions,
            actors: [],
            triggers: [],
          },
        },
        ids: ["scene1"],
      },
      backgrounds: {
        entities: {
          bg1: {
            ...dummyBackground,
            id: "bg1",
            width: 4,
            height: 3,
            tileColors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          },
        },
        ids: ["bg1"],
      },
    };

    const action = actions.deleteSceneColorSelection({
      sceneId: "scene1",
      selection: { x: 1, y: 1, width: 2, height: 2 },
    });

    const newState = reducer(state, action);

    expect(newState.scenes.entities["scene1"]?.collisions).toEqual(collisions);
  });
});

const tilemapPaintState = (
  overrides: Partial<EntitiesState["scenes"]["entities"]["scene1"]> = {},
  tilesetOverrides: Partial<typeof dummyTilesetResource> = {},
): EntitiesState => ({
  ...initialState,
  scenes: {
    entities: {
      scene1: {
        ...dummySceneNormalized,
        id: "scene1",
        backgroundId: "",
        width: 4,
        height: 4,
        actors: [],
        triggers: [],
        collisions: [],
        tilemap: {
          tilesets: [tilesetSnapshot("tiles1")],
          tileColors: new Array(16).fill(0),
          layers: [
            {
              id: "layer1",
              name: "Layer 1",
              visible: true,
              tiles: new Array(16).fill(0),
            },
          ],
        },
        ...overrides,
      },
    },
    ids: ["scene1"],
  },
  tilesets: {
    entities: {
      tiles1: {
        ...dummyTilesetResource,
        id: "tiles1",
        width: 4,
        height: 4,
        imageWidth: 32,
        imageHeight: 32,
        tileColors: [],
        tileCollisions: [],
        inode: "tiles1",
        _v: 0,
        ...tilesetOverrides,
      },
    },
    ids: ["tiles1"],
  },
});

test("Should move and delete a scene tile selection", () => {
  const tile = encodeSceneTileRef(0, 5);
  const state = tilemapPaintState({
    tilemap: {
      tilesets: [tilesetSnapshot("tiles1")],
      tileColors: new Array(16).fill(0),
      layers: [
        {
          id: "layer1",
          name: "Layer 1",
          visible: true,
          tiles: [tile, 0, 0, 0, ...new Array(12).fill(0)],
        },
      ],
    },
  });

  const moved = reducer(
    state,
    actions.moveSceneTileSelection({
      sceneId: "scene1",
      layerId: "layer1",
      selection: { x: 0, y: 0, width: 1, height: 1 },
      offset: { x: 1, y: 1 },
    }),
  );
  expect(moved.scenes.entities.scene1?.tilemap?.layers[0]?.tiles[5]).toBe(tile);
  expect(moved.scenes.entities.scene1?.tilemap?.layers[0]?.tiles[0]).toBe(0);

  const deleted = reducer(
    moved,
    actions.deleteSceneTileSelection({
      sceneId: "scene1",
      layerId: "layer1",
      selection: { x: 1, y: 1, width: 1, height: 1 },
    }),
  );
  expect(deleted.scenes.entities.scene1?.tilemap?.layers[0]?.tiles[5]).toBe(0);
});

test("Should move linked colors and collisions when moving topmost scene tiles", () => {
  const tile = encodeSceneTileRef(0, 0);
  const collisions = [1, 2, 3];
  const tileColors = [4, 5, 6];
  const state = tilemapPaintState({
    width: 3,
    height: 1,
    collisions,
    tilemap: {
      tilesets: [tilesetSnapshot("tiles1")],
      tileColors,
      layers: [
        { id: "layer1", name: "Layer 1", visible: true, tiles: [tile, 0, 0] },
      ],
    },
  });

  const moved = reducer(
    state,
    actions.moveSceneTileSelection({
      sceneId: "scene1",
      layerId: "layer1",
      selection: { x: 0, y: 0, width: 1, height: 1 },
      offset: { x: 2, y: 0 },
    }),
  );

  expect(moved.scenes.entities.scene1?.tilemap?.layers[0]?.tiles).toEqual([
    0,
    0,
    tile,
  ]);
  expect(moved.scenes.entities.scene1?.collisions).toEqual([0, 2, 1]);
  expect(moved.scenes.entities.scene1?.tilemap?.tileColors).toEqual([0, 5, 4]);
  expect(collisions).toEqual([1, 2, 3]);
  expect(tileColors).toEqual([4, 5, 6]);
});

test("Should apply defaults from a tile revealed below a moved selection", () => {
  const lowerTile = encodeSceneTileRef(0, 0);
  const upperTile = encodeSceneTileRef(0, 1);
  const state = tilemapPaintState(
    {
      width: 3,
      height: 1,
      collisions: [1, 2, 3],
      tilemap: {
        tilesets: [tilesetSnapshot("tiles1")],
        tileColors: [4, 5, 6],
        layers: [
          {
            id: "lower",
            name: "Lower",
            visible: true,
            tiles: [lowerTile, 0, 0],
          },
          {
            id: "upper",
            name: "Upper",
            visible: true,
            tiles: [upperTile, 0, 0],
          },
        ],
      },
    },
    {
      tileColors: [0x83, TILE_DEFAULT_UNSET],
      tileCollisions: [0x0f, TILE_DEFAULT_UNSET],
    },
  );

  const moved = reducer(
    state,
    actions.moveSceneTileSelection({
      sceneId: "scene1",
      layerId: "upper",
      selection: { x: 0, y: 0, width: 1, height: 1 },
      offset: { x: 2, y: 0 },
    }),
  );

  expect(moved.scenes.entities.scene1?.collisions).toEqual([0x0f, 2, 1]);
  expect(moved.scenes.entities.scene1?.tilemap?.tileColors).toEqual([
    0x83, 5, 4,
  ]);
});

test("Should preserve cleared linked values for unset revealed tile defaults", () => {
  const lowerTile = encodeSceneTileRef(0, 0);
  const upperTile = encodeSceneTileRef(0, 1);
  const state = tilemapPaintState(
    {
      width: 3,
      height: 1,
      collisions: [1, 2, 3],
      tilemap: {
        tilesets: [tilesetSnapshot("tiles1")],
        tileColors: [4, 5, 6],
        layers: [
          {
            id: "lower",
            name: "Lower",
            visible: true,
            tiles: [lowerTile, 0, 0],
          },
          {
            id: "upper",
            name: "Upper",
            visible: true,
            tiles: [upperTile, 0, 0],
          },
        ],
      },
    },
    {
      tileColors: [TILE_DEFAULT_UNSET, TILE_DEFAULT_UNSET],
      tileCollisions: [6, TILE_DEFAULT_UNSET],
    },
  );

  const moved = reducer(
    state,
    actions.moveSceneTileSelection({
      sceneId: "scene1",
      layerId: "upper",
      selection: { x: 0, y: 0, width: 1, height: 1 },
      offset: { x: 2, y: 0 },
    }),
  );

  expect(moved.scenes.entities.scene1?.collisions).toEqual([6, 2, 1]);
  expect(moved.scenes.entities.scene1?.tilemap?.tileColors).toEqual([0, 5, 4]);
});

test("Should not apply revealed defaults when a higher tile covered the moved selection", () => {
  const lowerTile = encodeSceneTileRef(0, 0);
  const movedTile = encodeSceneTileRef(0, 1);
  const higherTile = encodeSceneTileRef(0, 2);
  const state = tilemapPaintState(
    {
      width: 3,
      height: 1,
      collisions: [1, 2, 3],
      tilemap: {
        tilesets: [tilesetSnapshot("tiles1")],
        tileColors: [4, 5, 6],
        layers: [
          {
            id: "lower",
            name: "Lower",
            visible: true,
            tiles: [lowerTile, 0, 0],
          },
          {
            id: "moved",
            name: "Moved",
            visible: true,
            tiles: [movedTile, 0, 0],
          },
          {
            id: "higher",
            name: "Higher",
            visible: true,
            tiles: [higherTile, 0, 0],
          },
        ],
      },
    },
    {
      tileColors: [0x83, TILE_DEFAULT_UNSET, TILE_DEFAULT_UNSET],
      tileCollisions: [0x0f, TILE_DEFAULT_UNSET, TILE_DEFAULT_UNSET],
    },
  );

  const moved = reducer(
    state,
    actions.moveSceneTileSelection({
      sceneId: "scene1",
      layerId: "moved",
      selection: { x: 0, y: 0, width: 1, height: 1 },
      offset: { x: 2, y: 0 },
    }),
  );

  expect(moved.scenes.entities.scene1?.collisions).toEqual([1, 2, 3]);
  expect(moved.scenes.entities.scene1?.tilemap?.tileColors).toEqual([4, 5, 6]);
});

test("Should apply moved tile defaults when a hidden selection becomes topmost", () => {
  const movedTile = encodeSceneTileRef(0, 1);
  const higherTile = encodeSceneTileRef(0, 2);
  const state = tilemapPaintState(
    {
      width: 3,
      height: 1,
      collisions: [1, 2, 3],
      tilemap: {
        tilesets: [tilesetSnapshot("tiles1")],
        tileColors: [4, 5, 6],
        layers: [
          {
            id: "moved",
            name: "Moved",
            visible: true,
            tiles: [movedTile, 0, 0],
          },
          {
            id: "higher",
            name: "Higher",
            visible: true,
            tiles: [higherTile, 0, 0],
          },
        ],
      },
    },
    {
      tileColors: [TILE_DEFAULT_UNSET, 0x82, TILE_DEFAULT_UNSET],
      tileCollisions: [TILE_DEFAULT_UNSET, 7, TILE_DEFAULT_UNSET],
    },
  );

  const moved = reducer(
    state,
    actions.moveSceneTileSelection({
      sceneId: "scene1",
      layerId: "moved",
      selection: { x: 0, y: 0, width: 1, height: 1 },
      offset: { x: 2, y: 0 },
    }),
  );

  expect(moved.scenes.entities.scene1?.collisions).toEqual([1, 2, 7]);
  expect(moved.scenes.entities.scene1?.tilemap?.tileColors).toEqual([
    4, 5, 0x82,
  ]);
});

test("Should not apply moved tile defaults when it remains hidden at its destination", () => {
  const movedTile = encodeSceneTileRef(0, 1);
  const higherTile = encodeSceneTileRef(0, 2);
  const state = tilemapPaintState(
    {
      width: 3,
      height: 1,
      collisions: [1, 2, 3],
      tilemap: {
        tilesets: [tilesetSnapshot("tiles1")],
        tileColors: [4, 5, 6],
        layers: [
          {
            id: "moved",
            name: "Moved",
            visible: true,
            tiles: [movedTile, 0, 0],
          },
          {
            id: "higher",
            name: "Higher",
            visible: true,
            tiles: [higherTile, 0, higherTile],
          },
        ],
      },
    },
    {
      tileColors: [TILE_DEFAULT_UNSET, 0x82, TILE_DEFAULT_UNSET],
      tileCollisions: [TILE_DEFAULT_UNSET, 7, TILE_DEFAULT_UNSET],
    },
  );

  const moved = reducer(
    state,
    actions.moveSceneTileSelection({
      sceneId: "scene1",
      layerId: "moved",
      selection: { x: 0, y: 0, width: 1, height: 1 },
      offset: { x: 2, y: 0 },
    }),
  );

  expect(moved.scenes.entities.scene1?.collisions).toEqual([1, 2, 3]);
  expect(moved.scenes.entities.scene1?.tilemap?.tileColors).toEqual([4, 5, 6]);
});

test("Should not move linked colors and collisions when selected scene tile is hidden by a higher layer", () => {
  const lowerTile = encodeSceneTileRef(0, 0);
  const upperTile = encodeSceneTileRef(0, 1);
  const state = tilemapPaintState({
    width: 3,
    height: 1,
    collisions: [1, 2, 3],
    tilemap: {
      tilesets: [tilesetSnapshot("tiles1")],
      tileColors: [4, 5, 6],
      layers: [
        { id: "lower", name: "Lower", visible: true, tiles: [lowerTile, 0, 0] },
        { id: "upper", name: "Upper", visible: true, tiles: [upperTile, 0, 0] },
      ],
    },
  });

  const moved = reducer(
    state,
    actions.moveSceneTileSelection({
      sceneId: "scene1",
      layerId: "lower",
      selection: { x: 0, y: 0, width: 1, height: 1 },
      offset: { x: 1, y: 0 },
    }),
  );

  expect(moved.scenes.entities.scene1?.collisions).toEqual([1, 2, 3]);
  expect(moved.scenes.entities.scene1?.tilemap?.tileColors).toEqual([4, 5, 6]);
});

test("Should not replace linked colors and collisions when moved scene tile is hidden at destination", () => {
  const lowerTile = encodeSceneTileRef(0, 0);
  const upperTile = encodeSceneTileRef(0, 1);
  const state = tilemapPaintState({
    width: 3,
    height: 1,
    collisions: [1, 2, 3],
    tilemap: {
      tilesets: [tilesetSnapshot("tiles1")],
      tileColors: [4, 5, 6],
      layers: [
        { id: "lower", name: "Lower", visible: true, tiles: [lowerTile, 0, 0] },
        { id: "upper", name: "Upper", visible: true, tiles: [0, upperTile, 0] },
      ],
    },
  });

  const moved = reducer(
    state,
    actions.moveSceneTileSelection({
      sceneId: "scene1",
      layerId: "lower",
      selection: { x: 0, y: 0, width: 1, height: 1 },
      offset: { x: 1, y: 0 },
    }),
  );

  expect(moved.scenes.entities.scene1?.collisions).toEqual([0, 2, 3]);
  expect(moved.scenes.entities.scene1?.tilemap?.tileColors).toEqual([0, 5, 6]);
});

test("Should be able to move and delete a color selection on a tilemap scene", () => {
  const collisions = new Array(16).fill(9);
  const state = tilemapPaintState({
    collisions,
    tilemap: {
      tilesets: [],
      tileColors: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      layers: [
        {
          id: "layer1",
          name: "Layer 1",
          visible: true,
          tiles: new Array(16).fill(0),
        },
      ],
    },
  });

  const moved = reducer(
    state,
    actions.moveSceneColorSelection({
      sceneId: "scene1",
      selection: { x: 0, y: 0, width: 2, height: 2 },
      offset: { x: 1, y: 1 },
    }),
  );
  expect(moved.scenes.entities.scene1?.tilemap?.tileColors).toEqual([
    0, 0, 3, 4, 0, 1, 2, 8, 9, 5, 6, 12, 13, 14, 15, 16,
  ]);

  const deleted = reducer(
    state,
    actions.deleteSceneColorSelection({
      sceneId: "scene1",
      selection: { x: 1, y: 1, width: 2, height: 2 },
    }),
  );
  expect(deleted.scenes.entities.scene1?.tilemap?.tileColors).toEqual([
    1, 2, 3, 4, 5, 0, 0, 8, 9, 0, 0, 12, 13, 14, 15, 16,
  ]);
  expect(deleted.scenes.entities.scene1?.collisions).toEqual(collisions);
});

test("Should paint scene tiles and snapshot tilesets", () => {
  const state = tilemapPaintState({
    tilemap: {
      tilesets: [],
      tileColors: new Array(16).fill(0),
      layers: [
        {
          id: "layer1",
          name: "Layer 1",
          visible: true,
          tiles: new Array(16).fill(0),
        },
      ],
    },
  });

  const painted = reducer(
    state,
    actions.paintSceneTile({
      sceneId: "scene1",
      layerId: "layer1",
      tilesetId: "tiles1",
      tileIndex: 5,
      x: 1,
      y: 2,
    }),
  );

  const scene = painted.scenes.entities.scene1;
  expect(scene?.tilemap?.tilesets).toEqual([tilesetSnapshot("tiles1", 4, 4)]);
  expect(
    decodeSceneRef(
      scene?.tilemap,
      scene?.tilemap?.layers[0]?.tiles[2 * 4 + 1] ?? 0,
    )?.tileIndex,
  ).toBe(5);
});

test("Should preserve state when repainting an unchanged tile with matching defaults", () => {
  const state = tilemapPaintState(
    {
      width: 1,
      height: 1,
      collisions: [2],
      tilemap: {
        tilesets: [tilesetSnapshot("tiles1", 1, 1)],
        tileColors: [3],
        layers: [
          {
            id: "layer1",
            name: "Layer 1",
            visible: true,
            tiles: [encodeSceneTileRef(0, 0)],
          },
        ],
      },
    },
    {
      width: 1,
      height: 1,
      tileColors: [3],
      tileCollisions: [2],
    },
  );

  const painted = reducer(
    state,
    actions.paintSceneTile({
      sceneId: "scene1",
      layerId: "layer1",
      tilesetId: "tiles1",
      tileIndex: 0,
      x: 0,
      y: 0,
    }),
  );

  expect(painted).toBe(state);
});

test("Should add a tileset snapshot even when the numeric tile value is unchanged", () => {
  const tiles = [encodeSceneTileRef(1, 0)];
  const baseState = tilemapPaintState({
    width: 1,
    height: 1,
    tilemap: {
      tilesets: [tilesetSnapshot("tiles1", 1, 1)],
      tileColors: [0],
      layers: [
        {
          id: "layer1",
          name: "Layer 1",
          visible: true,
          tiles,
        },
      ],
    },
  });
  const state: EntitiesState = {
    ...baseState,
    tilesets: {
      entities: {
        ...baseState.tilesets.entities,
        tiles2: {
          ...dummyTilesetResource,
          id: "tiles2",
          width: 1,
          height: 1,
          imageWidth: 8,
          imageHeight: 8,
          tileColors: [],
          tileCollisions: [],
          inode: "tiles2",
          _v: 0,
        },
      },
      ids: [...baseState.tilesets.ids, "tiles2"],
    },
  };

  const painted = reducer(
    state,
    actions.paintSceneTile({
      sceneId: "scene1",
      layerId: "layer1",
      tilesetId: "tiles2",
      tileIndex: 0,
      x: 0,
      y: 0,
    }),
  );

  expect(painted.scenes.entities.scene1?.tilemap?.tilesets).toEqual([
    tilesetSnapshot("tiles1", 1, 1),
    tilesetSnapshot("tiles2", 1, 1),
  ]);
  expect(painted.scenes.entities.scene1?.tilemap?.layers[0]?.tiles).toBe(tiles);
});

test("Should reapply defaults when repainting an unchanged tile", () => {
  const state = tilemapPaintState(
    {
      width: 1,
      height: 1,
      collisions: [9],
      tilemap: {
        tilesets: [tilesetSnapshot("tiles1", 1, 1)],
        tileColors: [7],
        layers: [
          {
            id: "layer1",
            name: "Layer 1",
            visible: true,
            tiles: [encodeSceneTileRef(0, 0)],
          },
        ],
      },
    },
    {
      width: 1,
      height: 1,
      tileColors: [3],
      tileCollisions: [2],
    },
  );

  const painted = reducer(
    state,
    actions.paintSceneTile({
      sceneId: "scene1",
      layerId: "layer1",
      tilesetId: "tiles1",
      tileIndex: 0,
      x: 0,
      y: 0,
    }),
  );

  expect(painted.scenes.entities.scene1?.tilemap?.tileColors).toEqual([3]);
  expect(painted.scenes.entities.scene1?.collisions).toEqual([2]);
  expect(painted.scenes.entities.scene1?.tilemap?.layers[0]?.tiles).toBe(
    state.scenes.entities.scene1?.tilemap?.layers[0]?.tiles,
  );
});

test("Should preserve unchanged tile default arrays while painting", () => {
  const collisions = [0, 0, 0, 0];
  const tileColors = [0, 0, 0, 0];
  const state = tilemapPaintState(
    {
      width: 2,
      height: 2,
      collisions,
      tilemap: {
        tilesets: [tilesetSnapshot("tiles1")],
        tileColors,
        layers: [
          {
            id: "layer1",
            name: "Layer 1",
            visible: true,
            tiles: [0, 0, 0, 0],
          },
        ],
      },
    },
    {
      width: 1,
      height: 1,
      imageWidth: 8,
      imageHeight: 8,
      tileColors: [TILE_DEFAULT_UNSET],
      tileCollisions: [TILE_DEFAULT_UNSET],
    },
  );

  const painted = reducer(
    state,
    actions.paintSceneTile({
      sceneId: "scene1",
      layerId: "layer1",
      tilesetId: "tiles1",
      tileIndex: 0,
      x: 0,
      y: 0,
    }),
  );

  expect(painted.scenes.entities.scene1?.collisions).toBe(collisions);
  expect(painted.scenes.entities.scene1?.tilemap?.tileColors).toBe(tileColors);
});

test("Should distinguish unset tile defaults from explicit zero defaults", () => {
  const createState = (defaultValue: number) =>
    tilemapPaintState(
      {
        width: 1,
        height: 1,
        collisions: [0x0f],
        tilemap: {
          tilesets: [tilesetSnapshot("tiles1")],
          tileColors: [3],
          layers: [
            {
              id: "layer1",
              name: "Layer 1",
              visible: true,
              tiles: [0],
            },
          ],
        },
      },
      {
        width: 1,
        height: 1,
        imageWidth: 8,
        imageHeight: 8,
        tileColors: [defaultValue],
        tileCollisions: [defaultValue],
      },
    );
  const paint = (state: EntitiesState) =>
    reducer(
      state,
      actions.paintSceneTile({
        sceneId: "scene1",
        layerId: "layer1",
        tilesetId: "tiles1",
        tileIndex: 0,
        x: 0,
        y: 0,
      }),
    ).scenes.entities.scene1;

  const unset = paint(createState(TILE_DEFAULT_UNSET));
  expect(unset?.tilemap?.tileColors).toEqual([3]);
  expect(unset?.collisions).toEqual([0x0f]);

  const explicitZero = paint(createState(0));
  expect(explicitZero?.tilemap?.tileColors).toEqual([0]);
  expect(explicitZero?.collisions).toEqual([0]);
});

test("Should copy tile default arrays only when defaults change", () => {
  const collisions = [0x0f, 0, 0, 0];
  const tileColors = [0, 0, 0, 0];
  const state = tilemapPaintState(
    {
      width: 2,
      height: 2,
      collisions,
      tilemap: {
        tilesets: [tilesetSnapshot("tiles1")],
        tileColors,
        layers: [
          {
            id: "layer1",
            name: "Layer 1",
            visible: true,
            tiles: [0, 0, 0, 0],
          },
        ],
      },
    },
    {
      width: 1,
      height: 1,
      imageWidth: 8,
      imageHeight: 8,
      tileColors: [3],
      tileCollisions: [0],
    },
  );

  const painted = reducer(
    state,
    actions.paintSceneTile({
      sceneId: "scene1",
      layerId: "layer1",
      tilesetId: "tiles1",
      tileIndex: 0,
      x: 0,
      y: 0,
    }),
  );

  expect(painted.scenes.entities.scene1?.collisions).not.toBe(collisions);
  expect(painted.scenes.entities.scene1?.collisions[0]).toBe(0);
  expect(painted.scenes.entities.scene1?.tilemap?.tileColors).not.toBe(
    tileColors,
  );
  expect(painted.scenes.entities.scene1?.tilemap?.tileColors?.[0]).toBe(3);
});

test("Should update neighbouring RPG-style autotiles when painting and erasing", () => {
  let painted = tilemapPaintState(
    {
      tilemap: {
        tilesets: [tilesetSnapshot("tiles1", 4, 8)],
        tileColors: new Array(16).fill(0),
        layers: [
          {
            id: "layer1",
            name: "Layer 1",
            visible: true,
            tiles: new Array(16).fill(0),
          },
        ],
      },
    },
    { width: 4, height: 8 },
  );
  const paintTile = (x: number, y: number, tileIndex = 10) => {
    painted = reducer(
      painted,
      actions.paintSceneTile({
        sceneId: "scene1",
        layerId: "layer1",
        tilesetId: "tiles1",
        tileIndex,
        autotile: true,
        x,
        y,
      }),
    );
  };

  paintTile(1, 1);
  paintTile(2, 1);
  paintTile(1, 2);
  paintTile(2, 2);

  const layer = painted.scenes.entities.scene1?.tilemap?.layers[0];
  expect(
    decodeSceneRef(
      painted.scenes.entities.scene1?.tilemap,
      layer?.tiles[1 * 4 + 1] ?? 0,
    )?.tileIndex,
  ).toBe(23);

  paintTile(2, 1, -1);
  const erasedLayer = painted.scenes.entities.scene1?.tilemap?.layers[0];
  expect(
    decodeSceneRef(
      painted.scenes.entities.scene1?.tilemap,
      erasedLayer?.tiles[1 * 4 + 1] ?? 0,
    )?.tileIndex,
  ).toBe(22);
  expect(erasedLayer?.tiles[1 * 4 + 2]).toBe(0);
});

test.each([false, true])(
  "Should paint every tile in a fast dragged line (autotile: %s)",
  (autotile) => {
    const painted = reducer(
      tilemapPaintState({}, { width: 4, height: 8 }),
      actions.paintSceneTile({
        sceneId: "scene1",
        layerId: "layer1",
        tilesetId: "tiles1",
        tileIndex: 10,
        autotile,
        x: 0,
        y: 1,
        endX: 3,
        endY: 1,
        drawLine: true,
      }),
    );
    const layer = painted.scenes.entities.scene1?.tilemap?.layers[0];
    for (let x = 0; x <= 3; x++) {
      expect(layer?.tiles[1 * 4 + x]).not.toBe(0);
      expect(Boolean(layer?.autotiles?.[1 * 4 + x])).toBe(autotile);
    }
  },
);

test("Should paint tilemaps with a 16px brush", () => {
  const painted = reducer(
    tilemapPaintState(),
    actions.paintSceneTile({
      sceneId: "scene1",
      layerId: "layer1",
      tilesetId: "tiles1",
      tileIndex: 10,
      brush: "16px",
      x: 1,
      y: 1,
    }),
  );
  const tiles = painted.scenes.entities.scene1?.tilemap?.layers[0]?.tiles ?? [];
  expect([tiles[5], tiles[6], tiles[9], tiles[10]]).toEqual([11, 11, 11, 11]);
});

test("Should paint a rectangular tile selection as a stamp", () => {
  const painted = reducer(
    tilemapPaintState(
      {},
      {
        tileColors: [0xff, 0xff, 0xff, 0xff, 0xff, 3, 0x80, 0xff, 0xff, 5, 6],
        tileCollisions: [0, 0, 0, 0, 0, 0x0f, 0x01, 0, 0, 0x02, 0x04],
      },
    ),
    actions.paintSceneTile({
      sceneId: "scene1",
      layerId: "layer1",
      tilesetId: "tiles1",
      tileIndex: 5,
      stamp: { width: 2, height: 2, tilesetWidth: 4 },
      x: 1,
      y: 1,
    }),
  );
  const tiles = painted.scenes.entities.scene1?.tilemap?.layers[0]?.tiles ?? [];
  const tileAt = (x: number, y: number) =>
    decodeSceneRef(
      painted.scenes.entities.scene1?.tilemap,
      tiles[y * 4 + x] ?? 0,
    )?.tileIndex;

  expect([tileAt(1, 1), tileAt(2, 1), tileAt(1, 2), tileAt(2, 2)]).toEqual([
    5, 6, 9, 10,
  ]);
  expect(painted.scenes.entities.scene1?.tilemap?.tileColors).toEqual([
    0, 0, 0, 0, 0, 3, 0x80, 0, 0, 5, 6, 0, 0, 0, 0, 0,
  ]);
  expect(painted.scenes.entities.scene1?.collisions).toEqual([
    0, 0, 0, 0, 0, 0x0f, 0x01, 0, 0, 0x02, 0x04, 0, 0, 0, 0, 0,
  ]);
});

test("Should repeat a stamp when filling from the clicked position", () => {
  const target = encodeSceneTileRef(0, 0);
  const barrier = encodeSceneTileRef(0, 1);
  const sourceTiles = new Array(4 * 4).fill(target);
  sourceTiles[0] = barrier;
  const painted = reducer(
    tilemapPaintState({
      tilemap: {
        tilesets: [tilesetSnapshot("tiles1")],
        tileColors: [],
        layers: [
          {
            id: "layer1",
            name: "Layer 1",
            visible: true,
            tiles: sourceTiles,
          },
        ],
      },
    }),
    actions.paintSceneTile({
      sceneId: "scene1",
      layerId: "layer1",
      tilesetId: "tiles1",
      tileIndex: 5,
      stamp: { width: 2, height: 2, tilesetWidth: 4 },
      brush: "fill",
      x: 1,
      y: 1,
    }),
  );
  const tiles = painted.scenes.entities.scene1?.tilemap?.layers[0]?.tiles ?? [];
  const tileAt = (x: number, y: number) =>
    decodeSceneRef(
      painted.scenes.entities.scene1?.tilemap,
      tiles[y * 4 + x] ?? 0,
    )?.tileIndex;

  expect(tileAt(0, 0)).toBe(1);
  expect(tileAt(1, 1)).toBe(5);
  expect(tileAt(2, 1)).toBe(6);
  expect(tileAt(1, 2)).toBe(9);
  expect(tileAt(2, 2)).toBe(10);
});

test("Should paint palette and priority attributes on painted scene tiles", () => {
  const colored = reducer(
    tilemapPaintState({
      tilemap: {
        tilesets: [tilesetSnapshot("tiles1")],
        tileColors: new Array(16).fill(0),
        layers: [
          {
            id: "layer1",
            name: "Layer 1",
            visible: true,
            tiles: [1, ...new Array(15).fill(0)],
          },
        ],
      },
    }),
    actions.paintColor({
      sceneId: "scene1",
      backgroundId: "",
      x: 0,
      y: 0,
      paletteIndex: 3,
      brush: "8px",
      isTileProp: false,
    }),
  );
  const prioritized = reducer(
    colored,
    actions.paintColor({
      sceneId: "scene1",
      backgroundId: "",
      x: 0,
      y: 0,
      paletteIndex: 0x80,
      brush: "8px",
      isTileProp: true,
    }),
  );

  expect(prioritized.scenes.entities.scene1?.tilemap?.tileColors?.[0]).toBe(
    0x83,
  );
});

test("Should contextually erase painted tiles, collisions, and color attributes", () => {
  const state = tilemapPaintState({
    collisions: [0xff],
    tilemap: {
      tilesets: [tilesetSnapshot("tiles1")],
      tileColors: [0x83],
      layers: [
        {
          id: "layer1",
          name: "Layer 1",
          visible: true,
          tiles: [encodeSceneTileRef(0, 4)],
        },
      ],
    },
  });
  const withoutTile = reducer(
    state,
    actions.paintSceneTile({
      sceneId: "scene1",
      layerId: "layer1",
      tilesetId: "tiles1",
      tileIndex: 10,
      brush: "16px",
      erase: true,
      x: 0,
      y: 0,
    }),
  );
  const withoutCollision = reducer(
    withoutTile,
    actions.paintCollision({
      sceneId: "scene1",
      x: 0,
      y: 0,
      value: 0,
      mask: 0xff,
      brush: "16px",
    }),
  );
  const erased = reducer(
    withoutCollision,
    actions.paintColor({
      sceneId: "scene1",
      backgroundId: "",
      x: 0,
      y: 0,
      paletteIndex: 0,
      isTileProp: false,
      brush: "16px",
      erase: true,
    }),
  );

  expect(erased.scenes.entities.scene1?.tilemap?.layers[0]?.tiles[0]).toBe(0);
  expect(erased.scenes.entities.scene1?.collisions[0]).toBe(0);
  expect(erased.scenes.entities.scene1?.tilemap?.tileColors?.[0]).toBe(0);
});

test("Should magic paint matching tiles on painted scene collision and color maps", () => {
  const tileLookup = [1, 2, 1, 3];
  const collisionPainted = reducer(
    tilemapPaintState({
      width: 2,
      height: 2,
      collisions: [0, 0, 0, 0],
      tilemap: {
        tilesets: [tilesetSnapshot("tiles1")],
        tileColors: [0, 0, 0, 0],
        layers: [
          {
            id: "layer1",
            name: "Layer 1",
            visible: true,
            tiles: tileLookup,
          },
        ],
      },
    }),
    actions.paintCollision({
      sceneId: "scene1",
      tileLookup,
      x: 0,
      y: 0,
      value: 0x0f,
      brush: "magic",
      mask: 0xff,
    }),
  );
  expect(collisionPainted.scenes.entities.scene1?.collisions).toEqual([
    0x0f, 0, 0x0f, 0,
  ]);

  const colorPainted = reducer(
    collisionPainted,
    actions.paintColor({
      sceneId: "scene1",
      backgroundId: "",
      tileLookup,
      x: 0,
      y: 0,
      paletteIndex: 3,
      brush: "magic",
      isTileProp: false,
    }),
  );
  expect(colorPainted.scenes.entities.scene1?.tilemap?.tileColors).toEqual([
    3, 0, 3, 0,
  ]);
});

test("Should magic paint matching tiles on image scene collision and color maps", () => {
  const tileLookup = [1, 2, 1, 3];
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          backgroundId: "bg1",
          width: 2,
          height: 2,
          actors: [],
          triggers: [],
          collisions: [0, 0, 0, 0],
        },
      },
      ids: ["scene1"],
    },
    backgrounds: {
      entities: {
        bg1: {
          ...dummyBackground,
          id: "bg1",
          width: 2,
          height: 2,
          tileColors: [0, 0, 0, 0],
        },
      },
      ids: ["bg1"],
    },
  };

  const collisionPainted = reducer(
    state,
    actions.paintCollision({
      sceneId: "scene1",
      tileLookup,
      x: 0,
      y: 0,
      value: 0x0f,
      brush: "magic",
      mask: 0xff,
    }),
  );
  expect(collisionPainted.scenes.entities.scene1?.collisions).toEqual([
    0x0f, 0, 0x0f, 0,
  ]);

  const colorPainted = reducer(
    collisionPainted,
    actions.paintColor({
      sceneId: "scene1",
      backgroundId: "bg1",
      tileLookup,
      x: 0,
      y: 0,
      paletteIndex: 3,
      brush: "magic",
      isTileProp: false,
    }),
  );
  expect(colorPainted.backgrounds.entities.bg1?.tileColors).toEqual([
    3, 0, 3, 0,
  ]);
});

test("Should not apply tile defaults when painting behind a visible higher layer", () => {
  const collisions = [0x0f];
  const tileColors = [2];
  const painted = reducer(
    tilemapPaintState(
      {
        width: 1,
        height: 1,
        collisions,
        tilemap: {
          tilesets: [tilesetSnapshot("tiles1")],
          tileColors,
          layers: [
            {
              id: "lower",
              name: "Lower",
              visible: true,
              tiles: [0],
            },
            {
              id: "upper",
              name: "Upper",
              visible: true,
              tiles: [encodeSceneTileRef(0, 1)],
            },
          ],
        },
      },
      {
        width: 2,
        height: 1,
        imageWidth: 16,
        imageHeight: 8,
        tileColors: [3, 4],
        tileCollisions: [0x01, 0x02],
      },
    ),
    actions.paintSceneTile({
      sceneId: "scene1",
      layerId: "lower",
      tilesetId: "tiles1",
      tileIndex: 0,
      x: 0,
      y: 0,
    }),
  );

  expect(painted.scenes.entities.scene1?.tilemap?.layers[0]?.tiles[0]).toBe(
    encodeSceneTileRef(0, 0),
  );
  expect(painted.scenes.entities.scene1?.tilemap?.tileColors).toBe(tileColors);
  expect(painted.scenes.entities.scene1?.collisions).toBe(collisions);
});

test("Should apply tile defaults when painting the top visible layer", () => {
  const collisions = [0x0f];
  const tileColors = [2];
  const painted = reducer(
    tilemapPaintState(
      {
        width: 1,
        height: 1,
        collisions,
        tilemap: {
          tilesets: [tilesetSnapshot("tiles1")],
          tileColors,
          layers: [
            {
              id: "lower",
              name: "Lower",
              visible: true,
              tiles: [encodeSceneTileRef(0, 1)],
            },
            {
              id: "upper",
              name: "Upper",
              visible: true,
              tiles: [0],
            },
          ],
        },
      },
      {
        width: 2,
        height: 1,
        imageWidth: 16,
        imageHeight: 8,
        tileColors: [3, 4],
        tileCollisions: [0x01, 0x02],
      },
    ),
    actions.paintSceneTile({
      sceneId: "scene1",
      layerId: "upper",
      tilesetId: "tiles1",
      tileIndex: 0,
      x: 0,
      y: 0,
    }),
  );

  expect(painted.scenes.entities.scene1?.tilemap?.layers[1]?.tiles[0]).toBe(
    encodeSceneTileRef(0, 0),
  );
  expect(painted.scenes.entities.scene1?.tilemap?.tileColors).toEqual([3]);
  expect(painted.scenes.entities.scene1?.collisions).toEqual([0x01]);
  expect(painted.scenes.entities.scene1?.tilemap?.tileColors).not.toBe(
    tileColors,
  );
  expect(painted.scenes.entities.scene1?.collisions).not.toBe(collisions);
});

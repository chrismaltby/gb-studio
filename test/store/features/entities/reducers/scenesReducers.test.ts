/* eslint-disable camelcase */
import reducer, { initialState } from "store/features/entities/entitiesState";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import actions from "store/features/entities/entitiesActions";
import uuid from "uuid";
import {
  dummySceneNormalized,
  dummyBackground,
  dummyTilesetResource,
} from "../../../../dummydata";

jest.mock("uuid");
const mockUuid = uuid as jest.MockedFunction<typeof uuid>;

beforeEach(() => {
  let id = 0;
  mockUuid.mockImplementation(() => `uuid-${++id}`);
});

afterEach(() => {
  mockUuid.mockReset();
});

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

test("Should update scene dimensions to match new background", () => {
  const state: EntitiesState = {
    ...initialState,
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
  test("Should be able to clear a collision selection", () => {
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
  test("Should be able to move a color selection", () => {
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
      selection: { x: 0, y: 0, width: 1, height: 1 },
      offset: { x: 1, y: 1 },
    });

    const newState = reducer(state, action);

    expect(newState).toEqual(state);
  });
});

describe("deleteSceneColorSelection", () => {
  test("Should be able to clear a color selection", () => {
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

  test("Should not change scene collisions when clearing a color selection", () => {
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

/* eslint-disable camelcase */
import reducer, { initialState } from "store/features/entities/entitiesState";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import actions from "store/features/entities/entitiesActions";
import { dummySceneNormalized, dummyBackground } from "../../../../dummydata";

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

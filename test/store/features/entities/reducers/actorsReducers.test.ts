/* eslint-disable camelcase */
import reducer, { initialState } from "store/features/entities/entitiesState";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import actions from "store/features/entities/entitiesActions";
import {
  dummySceneNormalized,
  dummySpriteSheet,
  dummyActorNormalized,
} from "../../../../dummydata";
import { TILE_SIZE } from "consts";

test("Should be able to add an actor to a scene", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          width: 10,
          height: 5,
          actors: [],
          triggers: [],
        },
      },
      ids: ["scene1"],
    },
    spriteSheets: {
      entities: {
        sprite1: {
          ...dummySpriteSheet,
          id: "sprite1",
          filename: "sprite1.png",
        },
      },
      ids: ["sprite1"],
    },
  };

  const action = actions.addActor({ sceneId: "scene1", x: 2, y: 4 });

  const newState = reducer(state, action);

  const newActorId = action.payload.actorId;

  expect(state.actors.ids.length).toBe(0);
  expect(newState.actors.ids.length).toBe(1);
  expect(newState.scenes.entities["scene1"]?.actors).toEqual([newActorId]);
  expect(newState.actors.entities[newActorId]?.x).toBe(2);
  expect(newState.actors.entities[newActorId]?.y).toBe(4);
  expect(newState.actors.entities[newActorId]?.spriteSheetId).toBe("sprite1");
});

test("Should be able to add an actor to a scene with default values and variables", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          width: 10,
          height: 5,
          actors: [],
          triggers: [],
        },
      },
      ids: ["scene1"],
    },
    spriteSheets: {
      entities: {
        sprite1: {
          ...dummySpriteSheet,
          id: "sprite1",
          filename: "sprite1.png",
        },
      },
      ids: ["sprite1"],
    },
  };

  const action = actions.addActor({
    sceneId: "scene1",
    x: 2,
    y: 4,
    defaults: {
      id: "clipboard_id",
      name: "Clipboard Actor Name",
    },
    variables: [
      {
        id: "clipboard_id__L0",
        name: "Clipboard Variable Name",
        symbol: "VAR_clipboard_id__L0",
      },
    ],
  });

  const newState = reducer(state, action);

  const newActorId = action.payload.actorId;

  expect(newState.scenes.entities["scene1"]?.actors).toEqual([newActorId]);
  expect(newState.actors.entities[newActorId]?.name).toBe(
    "Clipboard Actor Name",
  );
  expect(newState.variables.entities[`${newActorId}__L0`]?.name).toBe(
    "Clipboard Variable Name",
  );
});

test("Should be able to move an actor with a scene", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          width: 10,
          height: 5,
          actors: ["actor1"],
          triggers: [],
        },
      },
      ids: ["scene1"],
    },
    actors: {
      entities: {
        actor1: {
          ...dummyActorNormalized,
          id: "actor1",
          x: 5,
          y: 2,
        },
      },
      ids: ["actor1"],
    },
  };

  const action = actions.moveActorToPx({
    actorId: "actor1",
    sceneId: "scene1",
    newSceneId: "scene1",
    x: 1 * TILE_SIZE,
    y: 3 * TILE_SIZE,
  });

  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.actors).toEqual(["actor1"]);
  expect(newState.actors.entities["actor1"]?.x).toBe(1);
  expect(newState.actors.entities["actor1"]?.y).toBe(3);
});

test("Should be able to move an actor with pixel units", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          width: 10,
          height: 5,
          actors: ["actor1"],
          triggers: [],
        },
      },
      ids: ["scene1"],
    },
    actors: {
      entities: {
        actor1: {
          ...dummyActorNormalized,
          id: "actor1",
          x: 5,
          y: 2,
          coordinateType: "pixels",
        },
      },
      ids: ["actor1"],
    },
  };

  const action = actions.moveActorToPx({
    actorId: "actor1",
    sceneId: "scene1",
    newSceneId: "scene1",
    x: 1,
    y: 3,
  });

  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.actors).toEqual(["actor1"]);
  expect(newState.actors.entities["actor1"]?.x).toBe(1);
  expect(newState.actors.entities["actor1"]?.y).toBe(3);
});

test("Should be able to move an actor between scenes", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          width: 10,
          height: 5,
          actors: ["actor1"],
          triggers: [],
        },
        scene2: {
          ...dummySceneNormalized,
          id: "scene2",
          width: 10,
          height: 5,
          actors: [],
          triggers: [],
        },
      },
      ids: ["scene1", "scene2"],
    },
    actors: {
      entities: {
        actor1: {
          ...dummyActorNormalized,
          id: "actor1",
          x: 5,
          y: 2,
        },
      },
      ids: ["actor1"],
    },
  };

  const action = actions.moveActorToPx({
    actorId: "actor1",
    sceneId: "scene1",
    newSceneId: "scene2",
    x: 4 * TILE_SIZE,
    y: 1 * TILE_SIZE,
  });

  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.actors).toEqual([]);
  expect(newState.scenes.entities["scene2"]?.actors).toEqual(["actor1"]);
  expect(newState.actors.entities["actor1"]?.x).toBe(4);
  expect(newState.actors.entities["actor1"]?.y).toBe(1);
});

test("Should be able to remove an actor by id", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          actors: ["actor1"],
          triggers: [],
        },
      },
      ids: ["scene1"],
    },
    actors: {
      entities: {
        actor1: {
          ...dummyActorNormalized,
          id: "actor1",
        },
      },
      ids: ["actor1"],
    },
  };

  const action = actions.removeActor({
    actorId: "actor1",
    sceneId: "scene1",
  });

  const newState = reducer(state, action);
  expect(newState.actors.ids.length).toBe(0);
  expect(newState.actors.entities["actor1"]).toBeUndefined();
  expect(newState.scenes.entities["scene1"]?.actors?.length).toBe(0);
});

test("Should be able to remove an actor at location", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          actors: ["actor1"],
          triggers: [],
        },
      },
      ids: ["scene1"],
    },
    actors: {
      entities: {
        actor1: {
          ...dummyActorNormalized,
          id: "actor1",
          x: 5,
          y: 6,
        },
      },
      ids: ["actor1"],
    },
  };

  const action = actions.removeActorAt({
    sceneId: "scene1",
    x: 5,
    y: 6,
  });

  const newState = reducer(state, action);
  expect(newState.actors.ids.length).toBe(0);
  expect(newState.actors.entities["actor1"]).toBeUndefined();
  expect(newState.scenes.entities["scene1"]?.actors?.length).toBe(0);
});

test("Should not remove actor outside of delete location", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          actors: ["actor1"],
          triggers: [],
        },
      },
      ids: ["scene1"],
    },
    actors: {
      entities: {
        actor1: {
          ...dummyActorNormalized,
          id: "actor1",
          x: 10,
          y: 6,
        },
      },
      ids: ["actor1"],
    },
  };

  const action = actions.removeActorAt({
    sceneId: "scene1",
    x: 5,
    y: 6,
  });

  const newState = reducer(state, action);
  expect(newState.actors.ids.length).toBe(1);
  expect(newState.actors.entities["actor1"]).toBe(state.actors.entities.actor1);
  expect(newState.scenes.entities["scene1"]?.actors?.length).toBe(1);
});

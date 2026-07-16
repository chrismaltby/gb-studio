import reducer, { initialState } from "store/features/entities/entitiesState";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import actions from "store/features/entities/entitiesActions";
import {
  dummySceneNormalized,
  dummyTriggerNormalized,
} from "../../../../dummydata";

test("Should be able to add a trigger to a scene", () => {
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
  };

  const action = actions.addTrigger({
    sceneId: "scene1",
    x: 1,
    y: 3,
    width: 4,
    height: 2,
  });

  const newState = reducer(state, action);

  const newTriggerId = action.payload.triggerId;

  expect(state.triggers.ids.length).toBe(0);
  expect(newState.triggers.ids.length).toBe(1);
  expect(newState.scenes.entities["scene1"]?.triggers).toEqual([newTriggerId]);
  expect(newState.triggers.entities[newTriggerId]?.x).toBe(1);
  expect(newState.triggers.entities[newTriggerId]?.y).toBe(3);
  expect(newState.triggers.entities[newTriggerId]?.width).toBe(4);
  expect(newState.triggers.entities[newTriggerId]?.height).toBe(2);
});

test("Should be able to add a trigger to a scene with defaults", () => {
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
  };

  const action = actions.addTrigger({
    sceneId: "scene1",
    x: 1,
    y: 3,
    width: 4,
    height: 2,
    defaults: {
      id: "trigger1",
      name: "Clipboard Trigger",
    },
  });

  const newState = reducer(state, action);

  const newTriggerId = action.payload.triggerId;

  expect(newState.triggers.ids.length).toBe(1);
  expect(newState.triggers.entities[newTriggerId]?.id).not.toBe("trigger1");
});

test("Should be able to move a trigger with a scene", () => {
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
          triggers: ["trigger1"],
        },
      },
      ids: ["scene1"],
    },
    triggers: {
      entities: {
        trigger1: {
          ...dummyTriggerNormalized,
          id: "trigger1",
          x: 5,
          y: 2,
        },
      },
      ids: ["trigger1"],
    },
  };

  const action = actions.moveTrigger({
    triggerId: "trigger1",
    sceneId: "scene1",
    newSceneId: "scene1",
    x: 1,
    y: 3,
  });

  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.triggers).toEqual(["trigger1"]);
  expect(newState.triggers.entities["trigger1"]?.x).toBe(1);
  expect(newState.triggers.entities["trigger1"]?.y).toBe(3);
});

test("Should be able to move a trigger between scenes", () => {
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
          triggers: ["trigger1"],
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
    triggers: {
      entities: {
        trigger1: {
          ...dummyTriggerNormalized,
          id: "trigger1",
          x: 5,
          y: 2,
        },
      },
      ids: ["trigger1"],
    },
  };

  const action = actions.moveTrigger({
    triggerId: "trigger1",
    sceneId: "scene1",
    newSceneId: "scene2",
    x: 4,
    y: 1,
  });

  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.triggers).toEqual([]);
  expect(newState.scenes.entities["scene2"]?.triggers).toEqual(["trigger1"]);
  expect(newState.triggers.entities["trigger1"]?.x).toBe(4);
  expect(newState.triggers.entities["trigger1"]?.y).toBe(1);
});

test("Should be able to remove a trigger by id", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          actors: [],
          triggers: ["trigger1"],
        },
      },
      ids: ["scene1"],
    },
    triggers: {
      entities: {
        trigger1: {
          ...dummyTriggerNormalized,
          id: "trigger1",
        },
      },
      ids: ["trigger1"],
    },
  };

  const action = actions.removeTrigger({
    triggerId: "trigger1",
    sceneId: "scene1",
  });

  const newState = reducer(state, action);
  expect(newState.triggers.ids.length).toBe(0);
  expect(newState.triggers.entities["trigger1"]).toBeUndefined();
  expect(newState.scenes.entities["scene1"]?.triggers?.length).toBe(0);
});

test("Should be able to remove a trigger at location", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          actors: [],
          triggers: ["trigger1"],
        },
      },
      ids: ["scene1"],
    },
    triggers: {
      entities: {
        trigger1: {
          ...dummyTriggerNormalized,
          id: "trigger1",
          x: 2,
          y: 3,
          width: 5,
          height: 1,
        },
      },
      ids: ["trigger1"],
    },
  };

  const action = actions.removeTriggerAt({
    sceneId: "scene1",
    x: 4,
    y: 3,
  });

  const newState = reducer(state, action);
  expect(newState.triggers.ids.length).toBe(0);
  expect(newState.triggers.entities["trigger1"]).toBeUndefined();
  expect(newState.scenes.entities["scene1"]?.triggers?.length).toBe(0);
});

test("Should not remove trigger outside of delete location", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          actors: [],
          triggers: ["trigger1"],
        },
      },
      ids: ["scene1"],
    },
    triggers: {
      entities: {
        trigger1: {
          ...dummyTriggerNormalized,
          id: "trigger1",
          x: 2,
          y: 3,
          width: 5,
          height: 1,
        },
      },
      ids: ["trigger1"],
    },
  };

  const action = actions.removeTriggerAt({
    sceneId: "scene1",
    x: 4,
    y: 4,
  });

  const newState = reducer(state, action);
  expect(newState.triggers.ids.length).toBe(1);
  expect(newState.triggers.entities["trigger1"]).toBe(
    state.triggers.entities.trigger1,
  );
  expect(newState.scenes.entities["scene1"]?.triggers?.length).toBe(1);
});

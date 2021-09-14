import reducer, {
  initialState,
} from "../../../../src/store/features/entities/entitiesState";
import { EntitiesState } from "../../../../src/store/features/entities/entitiesTypes";
import actions from "../../../../src/store/features/entities/entitiesActions";
import { dummyScene } from "../../../dummydata";

test("should be able to add a script event to an empty scene init script", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummyScene,
          id: "scene1",
          actors: [],
          triggers: [],
          script: [],
        },
      },
      ids: ["scene1"],
    },
    scriptEvents: {
      entities: {},
      ids: [],
    },
  };

  const action = actions.addScriptEvents({
    entityId: "scene1",
    type: "scene",
    key: "script",
    data: [
      {
        command: "EVENT_TEXT",
        args: {
          text: "Hello World",
        },
      },
    ],
  });

  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.script?.[0]).toBe(
    action.payload.scriptEventIds[0]
  );
  expect(state.scenes.entities["scene1"]?.script.length).toBe(0);
  expect(newState.scenes.entities["scene1"]?.script.length).toBe(1);
});

test("should not update state if destination script isn't found", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummyScene,
          id: "scene1",
          actors: [],
          triggers: [],
          script: [],
        },
      },
      ids: ["scene1"],
    },
    scriptEvents: {
      entities: {},
      ids: [],
    },
  };

  const action = actions.addScriptEvents({
    entityId: "sceneNOT_FOUND",
    type: "scene",
    key: "script",
    data: [
      {
        command: "EVENT_TEXT",
        args: {
          text: "Hello World",
        },
      },
    ],
  });

  const newState = reducer(state, action);
  expect(newState).toMatchObject(state);
});

test("should be able to add a script event to a scene init script before an existing event", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummyScene,
          id: "scene1",
          actors: [],
          triggers: [],
          script: ["script1"],
        },
      },
      ids: ["scene1"],
    },
    scriptEvents: {
      entities: {
        script1: {
          id: "script1",
          command: "EVENT_END",
        },
      },
      ids: ["script1"],
    },
  };

  const action = actions.addScriptEvents({
    entityId: "scene1",
    type: "scene",
    key: "script",
    insertId: "script1",
    before: true,
    data: [
      {
        command: "EVENT_TEXT",
        args: {
          text: "Hello World",
        },
      },
    ],
  });

  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.script?.[0]).toBe(
    action.payload.scriptEventIds[0]
  );
  expect(newState.scenes.entities["scene1"]?.script?.[1]).toBe("script1");
  expect(state.scenes.entities["scene1"]?.script.length).toBe(1);
  expect(newState.scenes.entities["scene1"]?.script.length).toBe(2);
});

test("should be able to add a script event to a scene init script after an existing event", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummyScene,
          id: "scene1",
          actors: [],
          triggers: [],
          script: ["script1"],
        },
      },
      ids: ["scene1"],
    },
    scriptEvents: {
      entities: {
        script1: {
          id: "script1",
          command: "EVENT_END",
        },
      },
      ids: ["script1"],
    },
  };

  const action = actions.addScriptEvents({
    entityId: "scene1",
    type: "scene",
    key: "script",
    insertId: "script1",
    before: false,
    data: [
      {
        command: "EVENT_TEXT",
        args: {
          text: "Hello World",
        },
      },
    ],
  });

  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.script?.[0]).toBe("script1");
  expect(newState.scenes.entities["scene1"]?.script?.[1]).toBe(
    action.payload.scriptEventIds[0]
  );
  expect(state.scenes.entities["scene1"]?.script.length).toBe(1);
  expect(newState.scenes.entities["scene1"]?.script.length).toBe(2);
});

test("should be able to add multiple script events to a scene init script", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummyScene,
          id: "scene1",
          actors: [],
          triggers: [],
          script: ["script1"],
        },
      },
      ids: ["scene1"],
    },
    scriptEvents: {
      entities: {
        script1: {
          id: "script1",
          command: "EVENT_END",
        },
      },
      ids: ["script1"],
    },
  };

  const action = actions.addScriptEvents({
    entityId: "scene1",
    type: "scene",
    key: "script",
    insertId: "script1",
    before: true,
    data: [
      {
        command: "EVENT_TEXT",
        args: {
          text: "Hello World",
        },
      },
      {
        command: "EVENT_TEXT",
        args: {
          text: "Goodbye World",
        },
      },
    ],
  });

  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.script?.[0]).toBe(
    action.payload.scriptEventIds[0]
  );
  expect(newState.scenes.entities["scene1"]?.script?.[1]).toBe(
    action.payload.scriptEventIds[1]
  );
  expect(newState.scenes.entities["scene1"]?.script?.[2]).toBe("script1");
  expect(state.scenes.entities["scene1"]?.script.length).toBe(1);
  expect(
    newState.scriptEvents.entities[action.payload.scriptEventIds[0]]?.args?.text
  ).toBe("Hello World");
  expect(
    newState.scriptEvents.entities[action.payload.scriptEventIds[1]]?.args?.text
  ).toBe("Goodbye World");

  expect(newState.scenes.entities["scene1"]?.script.length).toBe(3);
});

test("should be able to add multiple script events to a scene init script after an existing event", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummyScene,
          id: "scene1",
          actors: [],
          triggers: [],
          script: ["script1"],
        },
      },
      ids: ["scene1"],
    },
    scriptEvents: {
      entities: {
        script1: {
          id: "script1",
          command: "EVENT_END",
        },
      },
      ids: ["script1"],
    },
  };

  const action = actions.addScriptEvents({
    entityId: "scene1",
    type: "scene",
    key: "script",
    insertId: "script1",
    before: false,
    data: [
      {
        command: "EVENT_TEXT",
        args: {
          text: "Hello World",
        },
      },
      {
        command: "EVENT_TEXT",
        args: {
          text: "Goodbye World",
        },
      },
    ],
  });

  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.script?.[0]).toBe("script1");
  expect(newState.scenes.entities["scene1"]?.script?.[1]).toBe(
    action.payload.scriptEventIds[0]
  );
  expect(newState.scenes.entities["scene1"]?.script?.[2]).toBe(
    action.payload.scriptEventIds[1]
  );
  expect(state.scenes.entities["scene1"]?.script.length).toBe(1);
  expect(
    newState.scriptEvents.entities[action.payload.scriptEventIds[0]]?.args?.text
  ).toBe("Hello World");
  expect(
    newState.scriptEvents.entities[action.payload.scriptEventIds[1]]?.args?.text
  ).toBe("Goodbye World");
  expect(newState.scenes.entities["scene1"]?.script.length).toBe(3);
});

test("should be able to add a script event as child of conditional event true path", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummyScene,
          id: "scene1",
          actors: [],
          triggers: [],
          script: ["script1"],
        },
      },
      ids: ["scene1"],
    },
    scriptEvents: {
      entities: {
        script1: {
          id: "script1",
          command: "EVENT_IF",
          children: {
            true: [],
            false: [],
          },
        },
      },
      ids: ["script1"],
    },
  };
  const action = actions.addScriptEvents({
    entityId: "script1",
    type: "scriptEvent",
    key: "true",
    data: [
      {
        command: "EVENT_TEXT",
        args: {
          text: "Hello World",
        },
      },
    ],
  });

  const newState = reducer(state, action);
  expect(newState.scriptEvents.entities["script1"]?.children?.true?.[0]).toBe(
    action.payload.scriptEventIds[0]
  );
  expect(state.scriptEvents.entities["script1"]?.children?.true?.length).toBe(
    0
  );
  expect(
    newState.scriptEvents.entities["script1"]?.children?.true?.length
  ).toBe(1);
});

test("should be able to add a script event as child of conditional event false path", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummyScene,
          id: "scene1",
          actors: [],
          triggers: [],
          script: ["script1"],
        },
      },
      ids: ["scene1"],
    },
    scriptEvents: {
      entities: {
        script1: {
          id: "script1",
          command: "EVENT_IF",
          children: {
            true: [],
            false: [],
          },
        },
      },
      ids: ["script1"],
    },
  };
  const action = actions.addScriptEvents({
    entityId: "script1",
    type: "scriptEvent",
    key: "false",
    data: [
      {
        command: "EVENT_TEXT",
        args: {
          text: "Hello World",
        },
      },
    ],
  });

  const newState = reducer(state, action);
  expect(newState.scriptEvents.entities["script1"]?.children?.false?.[0]).toBe(
    action.payload.scriptEventIds[0]
  );
  expect(state.scriptEvents.entities["script1"]?.children?.false?.length).toBe(
    0
  );
  expect(
    newState.scriptEvents.entities["script1"]?.children?.false?.length
  ).toBe(1);
  expect(
    newState.scriptEvents.entities["script1"]?.children?.true?.length
  ).toBe(0);
});

test("should remove child ids provided in scriptEvent creation data", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummyScene,
          id: "scene1",
          actors: [],
          triggers: [],
          script: [],
        },
      },
      ids: ["scene1"],
    },
    scriptEvents: {
      entities: {},
      ids: [],
    },
  };

  const action = actions.addScriptEvents({
    entityId: "scene1",
    type: "scene",
    key: "script",
    data: [
      {
        command: "EVENT_IF",
        children: {
          true: ["script1"],
          false: ["script2"],
        },
      },
    ],
  });

  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.script?.[0]).toBe(
    action.payload.scriptEventIds[0]
  );
  expect(
    newState.scriptEvents.entities[action.payload.scriptEventIds[0]]?.children
      ?.true?.length
  ).toBe(0);
  expect(
    newState.scriptEvents.entities[action.payload.scriptEventIds[0]]?.children
      ?.false?.length
  ).toBe(0);
});

test("should be able to move an event to a new location in a script", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummyScene,
          id: "scene1",
          actors: [],
          triggers: [],
          script: ["script1", "script2"],
        },
      },
      ids: ["scene1"],
    },
    scriptEvents: {
      entities: {
        script1: {
          id: "script1",
          command: "EVENT_END",
        },
        script2: {
          id: "script2",
          command: "EVENT_END",
        },
      },
      ids: ["script1", "script2"],
    },
  };

  const action = actions.moveScriptEvent({
    from: {
      scriptEventId: "script2",
      parentType: "scene",
      parentKey: "script",
      parentId: "scene1",
    },
    to: {
      scriptEventId: "script1",
      parentType: "scene",
      parentKey: "script",
      parentId: "scene1",
    },
  });

  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.script?.[0]).toBe("script2");
  expect(newState.scenes.entities["scene1"]?.script?.[1]).toBe("script1");
});

test("should be able to move an event to the end of a script", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummyScene,
          id: "scene1",
          actors: [],
          triggers: [],
          script: ["script1", "script2", "script3"],
        },
      },
      ids: ["scene1"],
    },
    scriptEvents: {
      entities: {
        script1: {
          id: "script1",
          command: "EVENT_END",
        },
        script2: {
          id: "script2",
          command: "EVENT_END",
        },
        script3: {
          id: "script3",
          command: "EVENT_END",
        },
      },
      ids: ["script1", "script2", "script3"],
    },
  };

  const action = actions.moveScriptEvent({
    from: {
      scriptEventId: "script2",
      parentType: "scene",
      parentKey: "script",
      parentId: "scene1",
    },
    to: {
      scriptEventId: "",
      parentType: "scene",
      parentKey: "script",
      parentId: "scene1",
    },
  });

  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.script?.[0]).toBe("script1");
  expect(newState.scenes.entities["scene1"]?.script?.[1]).toBe("script3");
  expect(newState.scenes.entities["scene1"]?.script?.[2]).toBe("script2");
});

test("should be able to reset a script", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummyScene,
          id: "scene1",
          actors: [],
          triggers: [],
          script: ["script1", "script2", "script3"],
        },
      },
      ids: ["scene1"],
    },
    scriptEvents: {
      entities: {
        script1: {
          id: "script1",
          command: "EVENT_END",
        },
        script2: {
          id: "script2",
          command: "EVENT_END",
        },
        script3: {
          id: "script3",
          command: "EVENT_END",
        },
      },
      ids: ["script1", "script2", "script3"],
    },
  };

  const action = actions.resetScript({
    type: "scene",
    key: "script",
    entityId: "scene1",
  });

  const newState = reducer(state, action);
  expect(state.scenes.entities["scene1"]?.script?.length).toBe(3);
  expect(newState.scenes.entities["scene1"]?.script?.length).toBe(0);
});

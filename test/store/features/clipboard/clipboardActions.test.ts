import clipboardActions from "../../../../src/store/features/clipboard/clipboardActions";
import type { AppThunk, RootState } from "store/storeTypes";
import {
  dummyActorNormalized,
  dummyCustomEventNormalized,
  dummySceneNormalized,
  dummyTriggerNormalized,
} from "../../../dummydata";
import {
  MiddlewareAPI,
  Dispatch,
  UnknownAction,
  ThunkDispatch,
} from "@reduxjs/toolkit";
import {
  ClipboardTypeActors,
  ClipboardTypeScenes,
  ClipboardTypeScriptEvents,
} from "../../../../src/store/features/clipboard/clipboardTypes";
import API from "../../../__mocks__/apiMock";
import entitiesActions from "../../../../src/store/features/entities/entitiesActions";
import { loadScriptEventHandlerFromTrustedString } from "lib/scriptEventsHandlers/trustedHandler";

jest.mock("../../../__mocks__/apiMock");

const mockedAPI = jest.mocked(API);
const mockedClipboard = mockedAPI.clipboard;

const runThunk = (
  store: MiddlewareAPI<Dispatch<UnknownAction>, RootState>,
  thunk: AppThunk<Promise<void>>,
) =>
  thunk(
    store.dispatch as ThunkDispatch<RootState, unknown, UnknownAction>,
    store.getState,
    undefined,
  );

const noOpFileReader = () => "";

const actorFieldEvent = `const id = "EVENT_ACTOR_FIELD";

const fields = [{
    key: "actorId",
    type: "actor",
}];

module.exports = {
  id,
  fields,
};`;

const nestedActorFieldEvent = `const id = "EVENT_NESTED_ACTOR_FIELD";

const fields = [
  {
    type: "group",
    fields: [
      {
        key: "actorId",
        type: "actor",
      },
    ],
  }
];

module.exports = {
  id,
  fields,
};`;

const propertyFieldEvent = `const id = "EVENT_PROPERTY_FIELD";

const fields = [{
    key: "value",
    type: "value",
}];

module.exports = {
  id,
  fields,
};`;

const clipboardResourceState = (
  variables: Array<{
    id: string;
    name: string;
    symbol: string;
    type: "number" | "array";
    size?: number;
  }> = [],
  constants: Array<{
    id: string;
    name: string;
    symbol: string;
    value: number;
  }> = [],
) =>
  ({
    project: {
      present: {
        entities: {
          variables: {
            entities: Object.fromEntries(
              variables.map((variable) => [variable.id, variable]),
            ),
            ids: variables.map((variable) => variable.id),
          },
          constants: {
            entities: Object.fromEntries(
              constants.map((constant) => [constant.id, constant]),
            ),
            ids: constants.map((constant) => constant.id),
          },
          customEvents: { entities: {}, ids: [] },
          scriptEvents: { entities: {}, ids: [] },
        },
      },
    },
  }) as unknown as RootState;

const mockScriptEventClipboard = (data: unknown) => {
  mockedClipboard.readBuffer.mockImplementation((format) =>
    Promise.resolve(
      format === ClipboardTypeScriptEvents
        ? Buffer.from(JSON.stringify(data), "utf8")
        : Buffer.from(""),
    ),
  );
};

const pasteResourceScript = async (
  state: RootState,
  data: unknown,
  dispatch = jest.fn(),
) => {
  mockScriptEventClipboard(data);
  const store = {
    getState: () => state,
    dispatch,
  } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;
  await runThunk(
    store,
    clipboardActions.pasteScriptEvents({
      entityId: "targetActor",
      type: "actor",
      key: "script",
    }),
  );
  return dispatch.mock.calls.map(([action]) => action);
};

test("Should be able to copy actor to clipboard", async () => {
  mockedClipboard.writeBuffer.mockClear();

  const store = {
    getState: () => ({
      project: {
        present: {
          entities: {
            actors: {
              entities: {
                [dummyActorNormalized.id]: dummyActorNormalized,
              },
              ids: [dummyActorNormalized.id],
            },
            customEvents: {
              entities: {},
              ids: [],
            },
            actorPrefabs: {
              entities: {},
              ids: [],
            },
            variables: {
              entities: {},
              ids: [],
            },
            scriptEvents: {
              entities: {},
              ids: [],
            },
          },
        },
      },
    }),
    dispatch: jest.fn(),
  } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;

  const action = clipboardActions.copyActors({
    actorIds: [dummyActorNormalized.id],
  });

  await runThunk(store, action);

  expect(mockedClipboard.writeBuffer).toHaveBeenCalledWith(
    ClipboardTypeActors,
    Buffer.from(
      JSON.stringify({
        actors: [dummyActorNormalized],
        customEvents: [],
        variables: [],
        scriptEvents: [],
        actorPrefabs: [],
      }),
      "utf8",
    ),
  );
});

test("Should include referenced variables when copying actor", async () => {
  mockedClipboard.writeBuffer.mockClear();

  const store = {
    getState: () => ({
      project: {
        present: {
          entities: {
            actors: {
              entities: {
                [dummyActorNormalized.id]: dummyActorNormalized,
              },
              ids: [dummyActorNormalized.id],
            },
            customEvents: {
              entities: {},
              ids: [],
            },
            variables: {
              entities: {
                [`${dummyActorNormalized.id}_L0`]: {
                  id: `${dummyActorNormalized.id}_L0`,
                  name: "Actor Local",
                },
                // eslint-disable-next-line camelcase
                actor2_L0: {
                  id: "actor2_L0",
                  name: "Actor Local",
                },
              },
              ids: [`${dummyActorNormalized.id}_L0`, "actor2_L0"],
            },
            scriptEvents: {
              entities: {},
              ids: [],
            },
            actorPrefabs: {
              entities: {},
              ids: [],
            },
          },
        },
      },
    }),
    dispatch: jest.fn(),
  } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;

  const action = clipboardActions.copyActors({
    actorIds: [dummyActorNormalized.id],
  });

  await runThunk(store, action);

  expect(mockedClipboard.writeBuffer).toHaveBeenCalledWith(
    ClipboardTypeActors,
    Buffer.from(
      JSON.stringify({
        actors: [dummyActorNormalized],
        customEvents: [],
        variables: [
          {
            id: `${dummyActorNormalized.id}_L0`,
            name: "Actor Local",
          },
        ],
        scriptEvents: [],
        actorPrefabs: [],
      }),
      "utf8",
    ),
  );
});

test("Should remap actor references in scene init script when pasting scene", async () => {
  mockedClipboard.readBuffer.mockReset();

  const scriptEventHandler = await loadScriptEventHandlerFromTrustedString(
    actorFieldEvent,
    "eventTest.js",
    noOpFileReader,
  );
  const scriptEventDefs = { [scriptEventHandler.id]: scriptEventHandler };

  const scene = {
    ...dummySceneNormalized,
    id: "scene1",
    script: ["event1"],
    actors: ["sourceActor", "targetActor"],
  };

  const sourceActor = {
    ...dummyActorNormalized,
    id: "sourceActor",
  };

  const targetActor = {
    ...dummyActorNormalized,
    id: "targetActor",
  };

  const scriptEvent = {
    id: "event1",
    command: "EVENT_ACTOR_FIELD",
    args: {
      actorId: "targetActor",
    },
  };

  mockedClipboard.readBuffer.mockImplementation((format) =>
    Promise.resolve(
      format === ClipboardTypeScenes
        ? Buffer.from(
            JSON.stringify({
              scenes: [scene],
              actors: [sourceActor, targetActor],
              triggers: [],
              scriptEvents: [scriptEvent],
              variables: [],
              customEvents: [],
            }),
            "utf8",
          )
        : Buffer.from(""),
    ),
  );

  const dispatch = jest.fn();

  const store = {
    getState: () => ({
      project: {
        present: {
          entities: {
            customEvents: {
              entities: {},
              ids: [],
            },
            actorPrefabs: {
              entities: {},
              ids: [],
            },
            triggerPrefabs: {
              entities: {},
              ids: [],
            },
            scriptEvents: {
              entities: {},
              ids: [],
            },
          },
        },
      },
      scriptEventDefs: {
        lookup: scriptEventDefs,
      },
    }),
    dispatch,
  } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;

  await runThunk(store, clipboardActions.pasteSceneAt({ x: 0, y: 0 }));

  expect(dispatch.mock.calls.length).toBeGreaterThan(0);

  const pasteActions = dispatch.mock.calls.map(([action]) => action);

  const pastedTargetActorAction = pasteActions.find(
    (action) =>
      entitiesActions.addActor.match(action) &&
      action.payload.defaults?.id === "targetActor",
  );

  const addScriptEventAction = pasteActions.find(
    entitiesActions.addScriptEvents.match,
  );

  const pastedTargetActorId = pastedTargetActorAction?.payload.actorId;

  expect(pastedTargetActorId).toBeTruthy();
  expect(pastedTargetActorId).not.toBe("targetActor");
  expect(addScriptEventAction?.payload.data[0].args?.actorId).toBe(
    pastedTargetActorId,
  );
});

test("Should remap actor property references in scene init script when pasting scene", async () => {
  mockedClipboard.readBuffer.mockReset();

  const scriptEventHandler = await loadScriptEventHandlerFromTrustedString(
    propertyFieldEvent,
    "eventPropertyTest.js",
    noOpFileReader,
  );
  const scriptEventDefs = { [scriptEventHandler.id]: scriptEventHandler };

  const scene = {
    ...dummySceneNormalized,
    id: "scene1",
    script: ["event1"],
    actors: ["sourceActor", "targetActor"],
  };

  const sourceActor = {
    ...dummyActorNormalized,
    id: "sourceActor",
  };

  const targetActor = {
    ...dummyActorNormalized,
    id: "targetActor",
  };

  const scriptEvent = {
    id: "event1",
    command: "EVENT_PROPERTY_FIELD",
    args: {
      value: {
        type: "add",
        valueA: {
          type: "property",
          target: "sourceActor",
          property: "direction",
        },
        valueB: {
          type: "property",
          target: "targetActor",
          property: "direction",
        },
      },
    },
  };

  mockedClipboard.readBuffer.mockImplementation((format) =>
    Promise.resolve(
      format === ClipboardTypeScenes
        ? Buffer.from(
            JSON.stringify({
              scenes: [scene],
              actors: [sourceActor, targetActor],
              triggers: [],
              scriptEvents: [scriptEvent],
              variables: [],
              customEvents: [],
            }),
            "utf8",
          )
        : Buffer.from(""),
    ),
  );

  const dispatch = jest.fn();

  const store = {
    getState: () => ({
      project: {
        present: {
          entities: {
            customEvents: {
              entities: {},
              ids: [],
            },
            actorPrefabs: {
              entities: {},
              ids: [],
            },
            triggerPrefabs: {
              entities: {},
              ids: [],
            },
            scriptEvents: {
              entities: {},
              ids: [],
            },
          },
        },
      },
      scriptEventDefs: {
        lookup: scriptEventDefs,
      },
    }),
    dispatch,
  } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;

  await runThunk(store, clipboardActions.pasteSceneAt({ x: 0, y: 0 }));

  expect(dispatch.mock.calls.length).toBeGreaterThan(0);

  const pasteActions = dispatch.mock.calls.map(([action]) => action);

  const pastedTargetActorAction = pasteActions.find(
    (action) =>
      entitiesActions.addActor.match(action) &&
      action.payload.defaults?.id === "targetActor",
  );
  const pastedSourceActorAction = pasteActions.find(
    (action) =>
      entitiesActions.addActor.match(action) &&
      action.payload.defaults?.id === "sourceActor",
  );
  const addScriptEventAction = pasteActions.find(
    entitiesActions.addScriptEvents.match,
  );
  const pastedSourceActorId = pastedSourceActorAction?.payload.actorId;
  const pastedTargetActorId = pastedTargetActorAction?.payload.actorId;

  expect(pastedSourceActorId).toBeTruthy();
  expect(pastedSourceActorId).not.toBe("sourceActor");
  expect(pastedTargetActorId).toBeTruthy();
  expect(pastedTargetActorId).not.toBe("targetActor");
  expect(addScriptEventAction?.payload.data[0].args?.value).toEqual({
    type: "add",
    valueA: {
      type: "property",
      target: pastedSourceActorId,
      property: "direction",
    },
    valueB: {
      type: "property",
      target: pastedTargetActorId,
      property: "direction",
    },
  });
});

test("Should remap actor references in actor script when pasting scene", async () => {
  mockedClipboard.readBuffer.mockReset();

  const scene = {
    ...dummySceneNormalized,
    id: "scene1",
    actors: ["sourceActor", "targetActor"],
  };
  const sourceActor = {
    ...dummyActorNormalized,
    id: "sourceActor",
    script: ["event1"],
  };
  const targetActor = {
    ...dummyActorNormalized,
    id: "targetActor",
  };
  const scriptEvent = {
    id: "event1",
    command: "EVENT_ACTOR_FIELD",
    args: {
      actorId: "targetActor",
    },
  };
  mockedClipboard.readBuffer.mockImplementation((format) =>
    Promise.resolve(
      format === ClipboardTypeScenes
        ? Buffer.from(
            JSON.stringify({
              scenes: [scene],
              actors: [sourceActor, targetActor],
              triggers: [],
              scriptEvents: [scriptEvent],
              variables: [],
              customEvents: [],
            }),
            "utf8",
          )
        : Buffer.from(""),
    ),
  );
  const actorScriptEventHandler = await loadScriptEventHandlerFromTrustedString(
    actorFieldEvent,
    "eventTest.js",
    noOpFileReader,
  );
  const nestedScriptEventHandler =
    await loadScriptEventHandlerFromTrustedString(
      nestedActorFieldEvent,
      "eventNestedTest.js",
      noOpFileReader,
    );
  const scriptEventDefs = {
    [actorScriptEventHandler.id]: actorScriptEventHandler,
    [nestedScriptEventHandler.id]: nestedScriptEventHandler,
  };

  const dispatch = jest.fn();
  const store = {
    getState: () => ({
      project: {
        present: {
          entities: {
            customEvents: {
              entities: {},
              ids: [],
            },
            actorPrefabs: {
              entities: {},
              ids: [],
            },
            triggerPrefabs: {
              entities: {},
              ids: [],
            },
            scriptEvents: {
              entities: {},
              ids: [],
            },
          },
        },
      },
      scriptEventDefs: {
        lookup: scriptEventDefs,
      },
    }),
    dispatch,
  } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;

  await runThunk(store, clipboardActions.pasteSceneAt({ x: 0, y: 0 }));

  expect(dispatch.mock.calls.length).toBeGreaterThan(0);

  const pasteActions = dispatch.mock.calls.map(([action]) => action);

  const pastedSourceActorAction = pasteActions.find(
    (action) =>
      entitiesActions.addActor.match(action) &&
      action.payload.defaults?.id === "sourceActor",
  );
  const pastedTargetActorAction = pasteActions.find(
    (action) =>
      entitiesActions.addActor.match(action) &&
      action.payload.defaults?.id === "targetActor",
  );
  const pastedSourceActorId = pastedSourceActorAction?.payload.actorId;
  const pastedTargetActorId = pastedTargetActorAction?.payload.actorId;
  const addScriptEventAction = pasteActions.find(
    (action) =>
      entitiesActions.addScriptEvents.match(action) &&
      action.payload.type === "actor" &&
      action.payload.entityId === pastedSourceActorId,
  );

  expect(pastedSourceActorId).toBeTruthy();
  expect(pastedSourceActorId).not.toBe("sourceActor");
  expect(pastedTargetActorId).toBeTruthy();
  expect(pastedTargetActorId).not.toBe("targetActor");
  expect(addScriptEventAction?.payload.data[0].args?.actorId).toBe(
    pastedTargetActorId,
  );
});

test("Should remap actor references in trigger script when pasting scene", async () => {
  mockedClipboard.readBuffer.mockReset();

  const scene = {
    ...dummySceneNormalized,
    id: "scene1",
    actors: ["targetActor"],
    triggers: ["sourceTrigger"],
  };
  const targetActor = {
    ...dummyActorNormalized,
    id: "targetActor",
  };
  const sourceTrigger = {
    ...dummyTriggerNormalized,
    id: "sourceTrigger",
    script: ["event1"],
  };
  const scriptEvent = {
    id: "event1",
    command: "EVENT_NESTED_ACTOR_FIELD",
    args: {
      __section: "movement",
      actorId: "targetActor",
    },
  };
  mockedClipboard.readBuffer.mockImplementation((format) =>
    Promise.resolve(
      format === ClipboardTypeScenes
        ? Buffer.from(
            JSON.stringify({
              scenes: [scene],
              actors: [targetActor],
              triggers: [sourceTrigger],
              scriptEvents: [scriptEvent],
              variables: [],
              customEvents: [],
            }),
            "utf8",
          )
        : Buffer.from(""),
    ),
  );
  const actorScriptEventHandler = await loadScriptEventHandlerFromTrustedString(
    actorFieldEvent,
    "eventTest.js",
    noOpFileReader,
  );
  const nestedScriptEventHandler =
    await loadScriptEventHandlerFromTrustedString(
      nestedActorFieldEvent,
      "eventNestedTest.js",
      noOpFileReader,
    );
  const scriptEventDefs = {
    [actorScriptEventHandler.id]: actorScriptEventHandler,
    [nestedScriptEventHandler.id]: nestedScriptEventHandler,
  };

  const dispatch = jest.fn();
  const store = {
    getState: () => ({
      project: {
        present: {
          entities: {
            customEvents: {
              entities: {},
              ids: [],
            },
            actorPrefabs: {
              entities: {},
              ids: [],
            },
            triggerPrefabs: {
              entities: {},
              ids: [],
            },
            scriptEvents: {
              entities: {},
              ids: [],
            },
          },
        },
      },
      scriptEventDefs: {
        lookup: scriptEventDefs,
      },
    }),
    dispatch,
  } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;

  await runThunk(store, clipboardActions.pasteSceneAt({ x: 0, y: 0 }));

  expect(dispatch.mock.calls.length).toBeGreaterThan(0);

  const pasteActions = dispatch.mock.calls.map(([action]) => action);

  const pastedSourceTriggerAction = pasteActions.find(
    (action) =>
      entitiesActions.addTrigger.match(action) &&
      action.payload.defaults?.id === "sourceTrigger",
  );
  const pastedTargetActorAction = pasteActions.find(
    (action) =>
      entitiesActions.addActor.match(action) &&
      action.payload.defaults?.id === "targetActor",
  );
  const pastedSourceTriggerId = pastedSourceTriggerAction?.payload.triggerId;
  const pastedTargetActorId = pastedTargetActorAction?.payload.actorId;
  const addScriptEventAction = pasteActions.find(
    (action) =>
      entitiesActions.addScriptEvents.match(action) &&
      action.payload.type === "trigger" &&
      action.payload.entityId === pastedSourceTriggerId,
  );

  expect(pastedSourceTriggerId).toBeTruthy();
  expect(pastedSourceTriggerId).not.toBe("sourceTrigger");
  expect(pastedTargetActorId).toBeTruthy();
  expect(pastedTargetActorId).not.toBe("targetActor");
  expect(addScriptEventAction?.payload.data[0].args?.actorId).toBe(
    pastedTargetActorId,
  );
});

test("Should remap actor references in scene hit script when pasting scene", async () => {
  mockedClipboard.readBuffer.mockReset();

  const scene = {
    ...dummySceneNormalized,
    id: "scene1",
    playerHit1Script: ["event1"],
    actors: ["targetActor"],
  };
  const targetActor = {
    ...dummyActorNormalized,
    id: "targetActor",
  };
  const scriptEvent = {
    id: "event1",
    command: "EVENT_ACTOR_FIELD",
    args: {
      actorId: "targetActor",
    },
  };
  mockedClipboard.readBuffer.mockImplementation((format) =>
    Promise.resolve(
      format === ClipboardTypeScenes
        ? Buffer.from(
            JSON.stringify({
              scenes: [scene],
              actors: [targetActor],
              triggers: [],
              scriptEvents: [scriptEvent],
              variables: [],
              customEvents: [],
            }),
            "utf8",
          )
        : Buffer.from(""),
    ),
  );
  const actorScriptEventHandler = await loadScriptEventHandlerFromTrustedString(
    actorFieldEvent,
    "eventTest.js",
    noOpFileReader,
  );
  const nestedScriptEventHandler =
    await loadScriptEventHandlerFromTrustedString(
      nestedActorFieldEvent,
      "eventNestedTest.js",
      noOpFileReader,
    );
  const scriptEventDefs = {
    [actorScriptEventHandler.id]: actorScriptEventHandler,
    [nestedScriptEventHandler.id]: nestedScriptEventHandler,
  };

  const dispatch = jest.fn();
  const store = {
    getState: () => ({
      project: {
        present: {
          entities: {
            customEvents: {
              entities: {},
              ids: [],
            },
            actorPrefabs: {
              entities: {},
              ids: [],
            },
            triggerPrefabs: {
              entities: {},
              ids: [],
            },
            scriptEvents: {
              entities: {},
              ids: [],
            },
          },
        },
      },
      scriptEventDefs: {
        lookup: scriptEventDefs,
      },
    }),
    dispatch,
  } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;

  await runThunk(store, clipboardActions.pasteSceneAt({ x: 0, y: 0 }));

  expect(dispatch.mock.calls.length).toBeGreaterThan(0);

  const pasteActions = dispatch.mock.calls.map(([action]) => action);

  const pastedTargetActorAction = pasteActions.find(
    (action) =>
      entitiesActions.addActor.match(action) &&
      action.payload.defaults?.id === "targetActor",
  );
  const pastedTargetActorId = pastedTargetActorAction?.payload.actorId;
  const addScriptEventAction = pasteActions.find(
    (action) =>
      entitiesActions.addScriptEvents.match(action) &&
      action.payload.key === "playerHit1Script",
  );

  expect(pastedTargetActorId).toBeTruthy();
  expect(pastedTargetActorId).not.toBe("targetActor");
  expect(addScriptEventAction?.payload.data[0].args?.actorId).toBe(
    pastedTargetActorId,
  );
});

test("Should remap actor references in actor prefab overrides when pasting scene", async () => {
  mockedClipboard.readBuffer.mockReset();

  const scene = {
    ...dummySceneNormalized,
    id: "scene1",
    actors: ["sourceActor", "targetActor"],
  };
  const sourceActor = {
    ...dummyActorNormalized,
    id: "sourceActor",
    prefabScriptOverrides: {
      prefabEvent1: {
        id: "prefabEvent1",
        args: {
          actorId: "targetActor",
        },
      },
    },
  };
  const targetActor = {
    ...dummyActorNormalized,
    id: "targetActor",
  };
  const prefabScriptEvent = {
    id: "prefabEvent1",
    command: "EVENT_ACTOR_FIELD",
    args: {
      actorId: "sourceActor",
    },
  };
  mockedClipboard.readBuffer.mockImplementation((format) =>
    Promise.resolve(
      format === ClipboardTypeScenes
        ? Buffer.from(
            JSON.stringify({
              scenes: [scene],
              actors: [sourceActor, targetActor],
              triggers: [],
              scriptEvents: [prefabScriptEvent],
              variables: [],
              customEvents: [],
            }),
            "utf8",
          )
        : Buffer.from(""),
    ),
  );
  const actorScriptEventHandler = await loadScriptEventHandlerFromTrustedString(
    actorFieldEvent,
    "eventTest.js",
    noOpFileReader,
  );
  const nestedScriptEventHandler =
    await loadScriptEventHandlerFromTrustedString(
      nestedActorFieldEvent,
      "eventNestedTest.js",
      noOpFileReader,
    );
  const scriptEventDefs = {
    [actorScriptEventHandler.id]: actorScriptEventHandler,
    [nestedScriptEventHandler.id]: nestedScriptEventHandler,
  };

  const dispatch = jest.fn();
  const store = {
    getState: () => ({
      project: {
        present: {
          entities: {
            customEvents: {
              entities: {},
              ids: [],
            },
            actorPrefabs: {
              entities: {},
              ids: [],
            },
            triggerPrefabs: {
              entities: {},
              ids: [],
            },
            scriptEvents: {
              entities: {},
              ids: [],
            },
          },
        },
      },
      scriptEventDefs: {
        lookup: scriptEventDefs,
      },
    }),
    dispatch,
  } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;

  await runThunk(store, clipboardActions.pasteSceneAt({ x: 0, y: 0 }));

  expect(dispatch.mock.calls.length).toBeGreaterThan(0);

  const pasteActions = dispatch.mock.calls.map(([action]) => action);

  const pastedTargetActorAction = pasteActions.find(
    (action) =>
      entitiesActions.addActor.match(action) &&
      action.payload.defaults?.id === "targetActor",
  );
  const pastedTargetActorId = pastedTargetActorAction?.payload.actorId;
  const addActorAction = pasteActions.find(
    (action) =>
      entitiesActions.addActor.match(action) &&
      action.payload.defaults?.id === "sourceActor",
  );

  expect(pastedTargetActorId).toBeTruthy();
  expect(pastedTargetActorId).not.toBe("targetActor");
  expect(
    addActorAction?.payload.defaults?.prefabScriptOverrides?.prefabEvent1.args
      ?.actorId,
  ).toBe(pastedTargetActorId);
});

test("Should remap actor property references in actor prefab overrides when pasting scene", async () => {
  mockedClipboard.readBuffer.mockReset();

  const scene = {
    ...dummySceneNormalized,
    id: "scene1",
    actors: ["sourceActor", "targetActor"],
  };
  const sourceActor = {
    ...dummyActorNormalized,
    id: "sourceActor",
    prefabScriptOverrides: {
      prefabEvent1: {
        id: "prefabEvent1",
        args: {
          value: {
            type: "property",
            target: "targetActor",
            property: "xpos",
          },
        },
      },
    },
  };
  const targetActor = {
    ...dummyActorNormalized,
    id: "targetActor",
  };
  const prefabScriptEvent = {
    id: "prefabEvent1",
    command: "EVENT_PROPERTY_FIELD",
    args: {
      value: {
        type: "property",
        target: "sourceActor",
        property: "xpos",
      },
    },
  };
  mockedClipboard.readBuffer.mockImplementation((format) =>
    Promise.resolve(
      format === ClipboardTypeScenes
        ? Buffer.from(
            JSON.stringify({
              scenes: [scene],
              actors: [sourceActor, targetActor],
              triggers: [],
              scriptEvents: [prefabScriptEvent],
              variables: [],
              customEvents: [],
            }),
            "utf8",
          )
        : Buffer.from(""),
    ),
  );
  const propertyScriptEventHandler =
    await loadScriptEventHandlerFromTrustedString(
      propertyFieldEvent,
      "eventPropertyTest.js",
      noOpFileReader,
    );
  const scriptEventDefs = {
    [propertyScriptEventHandler.id]: propertyScriptEventHandler,
  };

  const dispatch = jest.fn();
  const store = {
    getState: () => ({
      project: {
        present: {
          entities: {
            customEvents: {
              entities: {},
              ids: [],
            },
            actorPrefabs: {
              entities: {},
              ids: [],
            },
            triggerPrefabs: {
              entities: {},
              ids: [],
            },
            scriptEvents: {
              entities: {},
              ids: [],
            },
          },
        },
      },
      scriptEventDefs: {
        lookup: scriptEventDefs,
      },
    }),
    dispatch,
  } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;

  await runThunk(store, clipboardActions.pasteSceneAt({ x: 0, y: 0 }));

  expect(dispatch.mock.calls.length).toBeGreaterThan(0);

  const pasteActions = dispatch.mock.calls.map(([action]) => action);

  const pastedTargetActorAction = pasteActions.find(
    (action) =>
      entitiesActions.addActor.match(action) &&
      action.payload.defaults?.id === "targetActor",
  );
  const pastedTargetActorId = pastedTargetActorAction?.payload.actorId;
  const addActorAction = pasteActions.find(
    (action) =>
      entitiesActions.addActor.match(action) &&
      action.payload.defaults?.id === "sourceActor",
  );

  expect(pastedTargetActorId).toBeTruthy();
  expect(pastedTargetActorId).not.toBe("targetActor");
  expect(
    addActorAction?.payload.defaults?.prefabScriptOverrides?.prefabEvent1.args
      ?.value,
  ).toEqual({
    type: "property",
    target: pastedTargetActorId,
    property: "xpos",
  });
});

test("Should remap actor references in trigger prefab overrides when pasting scene", async () => {
  mockedClipboard.readBuffer.mockReset();

  const scene = {
    ...dummySceneNormalized,
    id: "scene1",
    actors: ["targetActor"],
    triggers: ["sourceTrigger"],
  };
  const targetActor = {
    ...dummyActorNormalized,
    id: "targetActor",
  };
  const sourceTrigger = {
    ...dummyTriggerNormalized,
    id: "sourceTrigger",
    prefabScriptOverrides: {
      prefabEvent1: {
        id: "prefabEvent1",
        args: {
          actorId: "targetActor",
        },
      },
    },
  };
  const prefabScriptEvent = {
    id: "prefabEvent1",
    command: "EVENT_NESTED_ACTOR_FIELD",
    args: {
      __section: "movement",
      actorId: "targetActor",
    },
  };
  mockedClipboard.readBuffer.mockImplementation((format) =>
    Promise.resolve(
      format === ClipboardTypeScenes
        ? Buffer.from(
            JSON.stringify({
              scenes: [scene],
              actors: [targetActor],
              triggers: [sourceTrigger],
              scriptEvents: [prefabScriptEvent],
              variables: [],
              customEvents: [],
            }),
            "utf8",
          )
        : Buffer.from(""),
    ),
  );
  const actorScriptEventHandler = await loadScriptEventHandlerFromTrustedString(
    actorFieldEvent,
    "eventTest.js",
    noOpFileReader,
  );
  const nestedScriptEventHandler =
    await loadScriptEventHandlerFromTrustedString(
      nestedActorFieldEvent,
      "eventNestedTest.js",
      noOpFileReader,
    );
  const scriptEventDefs = {
    [actorScriptEventHandler.id]: actorScriptEventHandler,
    [nestedScriptEventHandler.id]: nestedScriptEventHandler,
  };

  const dispatch = jest.fn();
  const store = {
    getState: () => ({
      project: {
        present: {
          entities: {
            customEvents: {
              entities: {},
              ids: [],
            },
            actorPrefabs: {
              entities: {},
              ids: [],
            },
            triggerPrefabs: {
              entities: {},
              ids: [],
            },
            scriptEvents: {
              entities: {},
              ids: [],
            },
          },
        },
      },
      scriptEventDefs: {
        lookup: scriptEventDefs,
      },
    }),
    dispatch,
  } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;

  await runThunk(store, clipboardActions.pasteSceneAt({ x: 0, y: 0 }));

  expect(dispatch.mock.calls.length).toBeGreaterThan(0);

  const pasteActions = dispatch.mock.calls.map(([action]) => action);

  const pastedTargetActorAction = pasteActions.find(
    (action) =>
      entitiesActions.addActor.match(action) &&
      action.payload.defaults?.id === "targetActor",
  );
  const pastedTargetActorId = pastedTargetActorAction?.payload.actorId;
  const addTriggerAction = pasteActions.find(
    (action) =>
      entitiesActions.addTrigger.match(action) &&
      action.payload.defaults?.id === "sourceTrigger",
  );

  expect(pastedTargetActorId).toBeTruthy();
  expect(pastedTargetActorId).not.toBe("targetActor");
  expect(
    addTriggerAction?.payload.defaults?.prefabScriptOverrides?.prefabEvent1.args
      ?.actorId,
  ).toBe(pastedTargetActorId);
});

test("Should remap actor references in call script events when pasting scene", async () => {
  mockedClipboard.readBuffer.mockReset();

  const scriptEventHandler = await loadScriptEventHandlerFromTrustedString(
    actorFieldEvent,
    "eventTest.js",
    noOpFileReader,
  );
  const scriptEventDefs = { [scriptEventHandler.id]: scriptEventHandler };

  const scene = {
    ...dummySceneNormalized,
    id: "scene1",
    script: ["event1"],
    actors: ["sourceActor", "targetActor"],
  };

  const customEvent = {
    ...dummyCustomEventNormalized,
    id: "customEvent1",
    actors: {
      "0": {
        id: "0",
        name: "Actor A",
      },
    },
    variables: {
      V0: {
        id: "V0",
        name: "Variable A",
      },
    },
    script: ["event2"],
  };

  const sourceActor = {
    ...dummyActorNormalized,
    id: "sourceActor",
  };

  const targetActor = {
    ...dummyActorNormalized,
    id: "targetActor",
  };

  const scriptEvent = {
    id: "event1",
    command: "EVENT_CALL_CUSTOM_EVENT",
    args: {
      customEventId: "customEvent1",
      "$actor[0]$": "targetActor",
      "$variable[V0]$": {
        type: "add",
        valueA: {
          type: "property",
          target: "sourceActor",
          property: "direction",
        },
        valueB: {
          type: "property",
          target: "targetActor",
          property: "direction",
        },
      },
    },
  };

  const scriptEvent2 = {
    id: "event2",
    command: "EVENT_ACTOR_FIELD",
    args: {
      actorId: "0",
    },
  };

  mockedClipboard.readBuffer.mockImplementation((format) =>
    Promise.resolve(
      format === ClipboardTypeScenes
        ? Buffer.from(
            JSON.stringify({
              scenes: [scene],
              actors: [sourceActor, targetActor],
              triggers: [],
              scriptEvents: [scriptEvent, scriptEvent2],
              variables: [],
              customEvents: [customEvent],
            }),
            "utf8",
          )
        : Buffer.from(""),
    ),
  );

  const dispatch = jest.fn();

  const store = {
    getState: () => ({
      project: {
        present: {
          entities: {
            customEvents: {
              entities: {},
              ids: [],
            },
            actorPrefabs: {
              entities: {},
              ids: [],
            },
            triggerPrefabs: {
              entities: {},
              ids: [],
            },
            scriptEvents: {
              entities: {},
              ids: [],
            },
          },
        },
      },
      scriptEventDefs: {
        lookup: scriptEventDefs,
      },
    }),
    dispatch,
  } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;

  await runThunk(store, clipboardActions.pasteSceneAt({ x: 0, y: 0 }));

  expect(dispatch.mock.calls.length).toBeGreaterThan(0);

  const pasteActions = dispatch.mock.calls.map(([action]) => action);

  const pastedTargetActorAction = pasteActions.find(
    (action) =>
      entitiesActions.addActor.match(action) &&
      action.payload.defaults?.id === "targetActor",
  );
  const pastedSourceActorAction = pasteActions.find(
    (action) =>
      entitiesActions.addActor.match(action) &&
      action.payload.defaults?.id === "sourceActor",
  );

  const addScriptEventActions = pasteActions.filter(
    entitiesActions.addScriptEvents.match,
  );
  const addScriptEventActionsData = addScriptEventActions.flatMap(
    (action) => action.payload.data,
  );
  const addCallScriptData = addScriptEventActionsData.find(
    (event) => event.command === "EVENT_CALL_CUSTOM_EVENT",
  );

  const pastedSourceActorId = pastedSourceActorAction?.payload.actorId;
  const pastedTargetActorId = pastedTargetActorAction?.payload.actorId;

  expect(pastedSourceActorId).toBeTruthy();
  expect(pastedSourceActorId).not.toBe("sourceActor");
  expect(pastedTargetActorId).toBeTruthy();
  expect(pastedTargetActorId).not.toBe("targetActor");
  expect(addCallScriptData?.args?.["$actor[0]$"]).toBe(pastedTargetActorId);
  expect(addCallScriptData?.args?.["$variable[V0]$"]).toEqual({
    type: "add",
    valueA: {
      type: "property",
      target: pastedSourceActorId,
      property: "direction",
    },
    valueB: {
      type: "property",
      target: pastedTargetActorId,
      property: "direction",
    },
  });
});

test("Should include every referenced variable and constant when copying script events", async () => {
  mockedClipboard.writeBuffer.mockClear();
  const globalVariable = {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Score Array",
    symbol: "var_score_array",
    type: "array" as const,
    size: 8,
  };
  const unusedVariable = {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Unused",
    symbol: "var_unused",
    type: "number" as const,
  };
  const constant = {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Maximum",
    symbol: "const_maximum",
    value: 99,
  };
  const scriptEvent = {
    id: "event1",
    command: "EVENT_TEST",
    args: {
      value: {
        type: "variable",
        value: globalVariable.id,
        index: { type: "constant", value: constant.id },
      },
      dialogue: `Value: $${globalVariable.id}$`,
      expression: `@${constant.id}@ + 1`,
    },
  };
  const baseState = clipboardResourceState(
    [globalVariable, unusedVariable],
    [constant],
  );
  const state = {
    ...baseState,
    project: {
      present: {
        entities: {
          ...baseState.project.present.entities,
          scriptEvents: {
            entities: { [scriptEvent.id]: scriptEvent },
            ids: [scriptEvent.id],
          },
        },
      },
    },
  } as unknown as RootState;
  const store = {
    getState: () => state,
    dispatch: jest.fn(),
  } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;

  await runThunk(
    store,
    clipboardActions.copyScriptEvents({ scriptEventIds: [scriptEvent.id] }),
  );

  const [, buffer] = mockedClipboard.writeBuffer.mock.calls[0];
  expect(JSON.parse(buffer.toString("utf8"))).toMatchObject({
    variables: [globalVariable],
    constants: [constant],
  });
});

test("Should reuse compatible variables and constants with matching UUIDs", async () => {
  const variable = {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Score",
    symbol: "var_score",
    type: "array" as const,
    size: 4,
  };
  const constant = {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Maximum",
    symbol: "const_maximum",
    value: 10,
  };
  const actions = await pasteResourceScript(
    clipboardResourceState([variable], [constant]),
    {
      script: ["event1"],
      scriptEvents: [
        {
          id: "event1",
          command: "EVENT_TEST",
          args: {
            variable: { type: "variable", value: variable.id },
            constant: { type: "constant", value: constant.id },
          },
        },
      ],
      variables: [variable],
      constants: [constant],
      customEvents: [],
    },
  );

  expect(actions.some(entitiesActions.addVariable.match)).toBe(false);
  expect(actions.some(entitiesActions.addConstant.match)).toBe(false);
  expect(
    actions.find(entitiesActions.addScriptEvents.match)?.payload.data[0].args,
  ).toMatchObject({
    variable: { value: variable.id },
    constant: { value: constant.id },
  });
});

test("Should remap compatible name matches for arrays and constants", async () => {
  const sourceVariable = {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Inventory",
    symbol: "var_inventory",
    type: "array" as const,
    size: 16,
  };
  const targetVariable = {
    ...sourceVariable,
    id: "22222222-2222-2222-2222-222222222222",
  };
  const sourceConstant = {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Capacity",
    symbol: "const_capacity",
    value: 16,
  };
  const targetConstant = {
    ...sourceConstant,
    id: "44444444-4444-4444-4444-444444444444",
  };
  const actions = await pasteResourceScript(
    clipboardResourceState([targetVariable], [targetConstant]),
    {
      script: ["event1"],
      scriptEvents: [
        {
          id: "event1",
          command: "EVENT_TEST",
          args: {
            value: {
              type: "variable",
              value: sourceVariable.id,
              index: { type: "constant", value: sourceConstant.id },
            },
            dialogue: `$${sourceVariable.id}$`,
            expression: `@${sourceConstant.id}@`,
          },
        },
      ],
      variables: [sourceVariable],
      constants: [sourceConstant],
      customEvents: [],
    },
  );

  expect(
    actions.find(entitiesActions.addScriptEvents.match)?.payload.data[0].args,
  ).toMatchObject({
    value: { value: targetVariable.id, index: { value: targetConstant.id } },
    dialogue: `$${targetVariable.id}$`,
    expression: `@${targetConstant.id}@`,
  });
});

test("Should create missing arrays and constants with their original UUIDs and values", async () => {
  const variable = {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Inventory",
    symbol: "var_inventory",
    type: "array" as const,
    size: 12,
    flags: { persistent: "true" },
  };
  const constant = {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Capacity",
    symbol: "const_capacity",
    value: 12,
  };
  const actions = await pasteResourceScript(clipboardResourceState(), {
    script: ["event1"],
    scriptEvents: [
      {
        id: "event1",
        command: "EVENT_TEST",
        args: {
          variable: { type: "variable", value: variable.id },
          constant: { type: "constant", value: constant.id },
        },
      },
    ],
    variables: [variable],
    constants: [constant],
    customEvents: [],
  });

  expect(
    actions.find(entitiesActions.addVariable.match)?.payload.variableId,
  ).toBe(variable.id);
  expect(actions).toContainEqual(
    entitiesActions.setVariableType({ variableId: variable.id, type: "array" }),
  );
  expect(actions).toContainEqual(
    entitiesActions.setVariableSize({ variableId: variable.id, size: 12 }),
  );
  expect(
    actions.find(entitiesActions.addConstant.match)?.payload.constantId,
  ).toBe(constant.id);
  expect(actions).toContainEqual(
    entitiesActions.editConstant({
      constantId: constant.id,
      changes: { name: constant.name, value: constant.value },
    }),
  );
});

test("Should reuse matching UUIDs when clipboard properties are stale", async () => {
  const sourceVariable = {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Data",
    symbol: "var_data",
    type: "array" as const,
    size: 8,
  };
  const sourceConstant = {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Limit",
    symbol: "const_limit",
    value: 8,
  };
  const actions = await pasteResourceScript(
    clipboardResourceState(
      [
        {
          ...sourceVariable,
          name: "Renamed Data",
          type: "number" as const,
          size: undefined,
        },
      ],
      [{ ...sourceConstant, name: "Renamed Limit", value: 9 }],
    ),
    {
      script: ["event1"],
      scriptEvents: [
        {
          id: "event1",
          command: "EVENT_TEST",
          args: {
            variable: { type: "variable", value: sourceVariable.id },
            constant: { type: "constant", value: sourceConstant.id },
          },
        },
      ],
      variables: [sourceVariable],
      constants: [sourceConstant],
      customEvents: [],
    },
  );

  expect(actions.some(entitiesActions.addVariable.match)).toBe(false);
  expect(actions.some(entitiesActions.addConstant.match)).toBe(false);
  expect(
    actions.find(entitiesActions.addScriptEvents.match)?.payload.data[0].args,
  ).toMatchObject({
    variable: { value: sourceVariable.id },
    constant: { value: sourceConstant.id },
  });
});

test("Should treat legacy clipboard variables without a type as numbers", async () => {
  const matchingLegacyVariable = {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Counter",
    symbol: "var_counter_legacy",
  };
  const existingVariable = {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Counter",
    symbol: "var_counter",
    type: "number" as const,
  };
  const newLegacyVariable = {
    id: "33333333-3333-3333-3333-333333333333",
    name: "New Counter",
    symbol: "var_new_counter_legacy",
  };
  const actions = await pasteResourceScript(
    clipboardResourceState([existingVariable]),
    {
      script: ["event1"],
      scriptEvents: [
        {
          id: "event1",
          command: "EVENT_TEST",
          args: {
            existing: {
              type: "variable",
              value: matchingLegacyVariable.id,
            },
            created: { type: "variable", value: newLegacyVariable.id },
          },
        },
      ],
      variables: [matchingLegacyVariable, newLegacyVariable],
      constants: [],
      customEvents: [],
    },
  );

  const addVariableActions = actions.filter(entitiesActions.addVariable.match);
  expect(addVariableActions).toHaveLength(1);
  expect(addVariableActions[0].payload.variableId).toBe(newLegacyVariable.id);
  expect(actions).toContainEqual(
    entitiesActions.setVariableType({
      variableId: newLegacyVariable.id,
      type: "number",
    }),
  );
  expect(
    actions.find(entitiesActions.addScriptEvents.match)?.payload.data[0].args,
  ).toMatchObject({
    existing: { value: existingVariable.id },
    created: { value: newLegacyVariable.id },
  });
});

test("Should only remap raw numeric IDs in schema-defined variable fields", async () => {
  const sourceVariable = {
    id: "0",
    name: "Counter",
    symbol: "var_counter_source",
    type: "number" as const,
  };
  const targetVariable = {
    ...sourceVariable,
    id: "11111111-1111-1111-1111-111111111111",
    symbol: "var_counter_target",
  };
  const baseState = clipboardResourceState([targetVariable]);
  const state = {
    ...baseState,
    scriptEventDefs: {
      lookup: {
        EVENT_TEST: {
          fieldsLookup: {
            variable: { type: "variable" },
            unrelatedOption: { type: "select" },
          },
        },
      },
    },
  } as unknown as RootState;
  const actions = await pasteResourceScript(state, {
    script: ["event1"],
    scriptEvents: [
      {
        id: "event1",
        command: "EVENT_TEST",
        args: {
          variable: "0",
          unrelatedOption: "0",
        },
      },
    ],
    variables: [sourceVariable],
    constants: [],
    customEvents: [],
  });

  expect(
    actions.find(entitiesActions.addScriptEvents.match)?.payload.data[0].args,
  ).toMatchObject({
    variable: targetVariable.id,
    unrelatedOption: "0",
  });
});

test("Should not collect numeric IDs from unrelated string fields", async () => {
  mockedClipboard.writeBuffer.mockClear();
  const variable = {
    id: "0",
    name: "Counter",
    symbol: "var_counter",
    type: "number" as const,
  };
  const event = {
    id: "event1",
    command: "EVENT_TEST",
    args: { unrelatedOption: "0" },
  };
  const baseState = clipboardResourceState([variable]);
  const state = {
    ...baseState,
    project: {
      present: {
        entities: {
          ...baseState.project.present.entities,
          scriptEvents: {
            entities: { [event.id]: event },
            ids: [event.id],
          },
        },
      },
    },
    scriptEventDefs: {
      lookup: {
        EVENT_TEST: {
          fieldsLookup: { unrelatedOption: { type: "select" } },
        },
      },
    },
  } as unknown as RootState;
  const store = {
    getState: () => state,
    dispatch: jest.fn(),
  } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;

  await runThunk(
    store,
    clipboardActions.copyScriptEvents({ scriptEventIds: [event.id] }),
  );

  const [, buffer] = mockedClipboard.writeBuffer.mock.calls[0];
  expect(JSON.parse(buffer.toString("utf8")).variables).toBeUndefined();
});

test("Should keep same-named clipboard resources distinct when creating them", async () => {
  const variableA = {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Counter",
    symbol: "var_counter_a",
    type: "number" as const,
  };
  const variableB = {
    ...variableA,
    id: "22222222-2222-2222-2222-222222222222",
  };
  const constantA = {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Limit",
    symbol: "const_limit_a",
    value: 10,
  };
  const constantB = {
    ...constantA,
    id: "44444444-4444-4444-4444-444444444444",
  };
  const actions = await pasteResourceScript(clipboardResourceState(), {
    script: ["event1"],
    scriptEvents: [
      {
        id: "event1",
        command: "EVENT_TEST",
        args: {
          variableA: { type: "variable", value: variableA.id },
          variableB: { type: "variable", value: variableB.id },
          constantA: { type: "constant", value: constantA.id },
          constantB: { type: "constant", value: constantB.id },
        },
      },
    ],
    variables: [variableA, variableB],
    constants: [constantA, constantB],
    customEvents: [],
  });

  expect(actions.filter(entitiesActions.addVariable.match)).toHaveLength(2);
  expect(actions.filter(entitiesActions.addConstant.match)).toHaveLength(2);
  expect(
    actions.find(entitiesActions.addScriptEvents.match)?.payload.data[0].args,
  ).toMatchObject({
    variableA: { value: variableA.id },
    variableB: { value: variableB.id },
    constantA: { value: constantA.id },
    constantB: { value: constantB.id },
  });
});

test("Should create resources when destination name matches are ambiguous", async () => {
  const sourceVariable = {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Counter",
    symbol: "var_counter_source",
    type: "number" as const,
  };
  const sourceConstant = {
    id: "44444444-4444-4444-4444-444444444444",
    name: "Limit",
    symbol: "const_limit_source",
    value: 10,
  };
  const actions = await pasteResourceScript(
    clipboardResourceState(
      [
        { ...sourceVariable, id: "22222222-2222-2222-2222-222222222222" },
        { ...sourceVariable, id: "33333333-3333-3333-3333-333333333333" },
      ],
      [
        { ...sourceConstant, id: "55555555-5555-5555-5555-555555555555" },
        { ...sourceConstant, id: "66666666-6666-6666-6666-666666666666" },
      ],
    ),
    {
      script: ["event1"],
      scriptEvents: [
        {
          id: "event1",
          command: "EVENT_TEST",
          args: {
            variable: { type: "variable", value: sourceVariable.id },
            constant: { type: "constant", value: sourceConstant.id },
          },
        },
      ],
      variables: [sourceVariable],
      constants: [sourceConstant],
      customEvents: [],
    },
  );

  expect(
    actions.find(entitiesActions.addVariable.match)?.payload.variableId,
  ).toBe(sourceVariable.id);
  expect(
    actions.find(entitiesActions.addConstant.match)?.payload.constantId,
  ).toBe(sourceConstant.id);
});

test("Should reserve UUID matches before applying name fallbacks", async () => {
  const uuidVariable = {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Counter",
    symbol: "var_counter",
    type: "number" as const,
  };
  const nameOnlyVariable = {
    ...uuidVariable,
    id: "11111111-1111-1111-1111-111111111111",
  };
  const uuidConstant = {
    id: "44444444-4444-4444-4444-444444444444",
    name: "Limit",
    symbol: "const_limit",
    value: 10,
  };
  const nameOnlyConstant = {
    ...uuidConstant,
    id: "33333333-3333-3333-3333-333333333333",
  };
  const actions = await pasteResourceScript(
    clipboardResourceState([uuidVariable], [uuidConstant]),
    {
      script: ["event1"],
      scriptEvents: [
        {
          id: "event1",
          command: "EVENT_TEST",
          args: {
            nameOnlyVariable: {
              type: "variable",
              value: nameOnlyVariable.id,
            },
            uuidVariable: { type: "variable", value: uuidVariable.id },
            nameOnlyConstant: {
              type: "constant",
              value: nameOnlyConstant.id,
            },
            uuidConstant: { type: "constant", value: uuidConstant.id },
          },
        },
      ],
      variables: [nameOnlyVariable, uuidVariable],
      constants: [nameOnlyConstant, uuidConstant],
      customEvents: [],
    },
  );

  expect(
    actions.find(entitiesActions.addVariable.match)?.payload.variableId,
  ).toBe(nameOnlyVariable.id);
  expect(
    actions.find(entitiesActions.addConstant.match)?.payload.constantId,
  ).toBe(nameOnlyConstant.id);
  expect(
    actions.find(entitiesActions.addScriptEvents.match)?.payload.data[0].args,
  ).toMatchObject({
    nameOnlyVariable: { value: nameOnlyVariable.id },
    uuidVariable: { value: uuidVariable.id },
    nameOnlyConstant: { value: nameOnlyConstant.id },
    uuidConstant: { value: uuidConstant.id },
  });
});

test("Should collect schema-defined resources from actor prefab overrides", async () => {
  mockedClipboard.writeBuffer.mockClear();
  const referencedVariable = {
    id: "0",
    name: "Counter",
    symbol: "var_counter",
    type: "number" as const,
  };
  const unrelatedVariable = {
    id: "1",
    name: "Unrelated",
    symbol: "var_unrelated",
    type: "number" as const,
  };
  const constant = {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Limit",
    symbol: "const_limit",
    value: 10,
  };
  const event = { id: "event1", command: "EVENT_TEST", args: {} };
  const actor = {
    ...dummyActorNormalized,
    id: "actor1",
    script: [event.id],
    prefabScriptOverrides: {
      [event.id]: {
        id: event.id,
        args: {
          variable: referencedVariable.id,
          unrelatedOption: unrelatedVariable.id,
          constant: { type: "constant", value: constant.id },
        },
      },
    },
  };
  const state = {
    project: {
      present: {
        entities: {
          actors: { entities: { [actor.id]: actor }, ids: [actor.id] },
          variables: {
            entities: {
              [referencedVariable.id]: referencedVariable,
              [unrelatedVariable.id]: unrelatedVariable,
            },
            ids: [referencedVariable.id, unrelatedVariable.id],
          },
          constants: {
            entities: { [constant.id]: constant },
            ids: [constant.id],
          },
          scriptEvents: {
            entities: { [event.id]: event },
            ids: [event.id],
          },
          customEvents: { entities: {}, ids: [] },
          actorPrefabs: { entities: {}, ids: [] },
        },
      },
    },
    scriptEventDefs: {
      lookup: {
        EVENT_TEST: {
          fieldsLookup: {
            variable: { type: "variable" },
            unrelatedOption: { type: "select" },
            constant: { type: "value" },
          },
        },
      },
    },
  } as unknown as RootState;
  const store = {
    getState: () => state,
    dispatch: jest.fn(),
  } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;

  await runThunk(store, clipboardActions.copyActors({ actorIds: [actor.id] }));

  const [, buffer] = mockedClipboard.writeBuffer.mock.calls[0];
  const clipboardData = JSON.parse(buffer.toString("utf8"));
  expect(clipboardData.variables).toEqual([referencedVariable]);
  expect(clipboardData.constants).toEqual([constant]);
});

test("Should remap resources in prefab overrides using the event schema", async () => {
  const sourceVariable = {
    id: "0",
    name: "Counter",
    symbol: "var_counter_source",
    type: "number" as const,
  };
  const targetVariable = {
    ...sourceVariable,
    id: "11111111-1111-1111-1111-111111111111",
  };
  const sourceConstant = {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Limit",
    symbol: "const_limit_source",
    value: 10,
  };
  const targetConstant = {
    ...sourceConstant,
    id: "33333333-3333-3333-3333-333333333333",
  };
  const event = { id: "event1", command: "EVENT_TEST", args: {} };
  const actor = {
    ...dummyActorNormalized,
    id: "sourceActor",
    script: [event.id],
    prefabScriptOverrides: {
      [event.id]: {
        id: event.id,
        args: {
          variable: sourceVariable.id,
          unrelatedOption: sourceVariable.id,
          constant: { type: "constant", value: sourceConstant.id },
        },
      },
    },
  };
  mockedClipboard.readBuffer.mockImplementation((format) =>
    Promise.resolve(
      format === ClipboardTypeActors
        ? Buffer.from(
            JSON.stringify({
              actors: [actor],
              scriptEvents: [event],
              variables: [sourceVariable],
              constants: [sourceConstant],
              customEvents: [],
              actorPrefabs: [],
            }),
            "utf8",
          )
        : Buffer.from(""),
    ),
  );
  const baseState = clipboardResourceState([targetVariable], [targetConstant]);
  const state = {
    ...baseState,
    project: {
      present: {
        entities: {
          ...baseState.project.present.entities,
          actorPrefabs: { entities: {}, ids: [] },
        },
      },
    },
    scriptEventDefs: {
      lookup: {
        EVENT_TEST: {
          fieldsLookup: {
            variable: { type: "variable" },
            unrelatedOption: { type: "select" },
            constant: { type: "value" },
          },
        },
      },
    },
  } as unknown as RootState;
  const dispatch = jest.fn();
  const store = {
    getState: () => state,
    dispatch,
  } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;

  await runThunk(
    store,
    clipboardActions.pasteActorAt({ sceneId: "scene1", x: 0, y: 0 }),
  );

  const addActorAction = dispatch.mock.calls
    .map(([action]) => action)
    .find(entitiesActions.addActor.match);
  expect(
    addActorAction?.payload.defaults?.prefabScriptOverrides?.[event.id].args,
  ).toMatchObject({
    variable: targetVariable.id,
    unrelatedOption: sourceVariable.id,
    constant: { value: targetConstant.id },
  });
});

test("Should reconcile resources when pasting script event values", async () => {
  const sourceVariable = {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Counter",
    symbol: "var_counter_source",
    type: "number" as const,
  };
  const targetVariable = {
    ...sourceVariable,
    id: "22222222-2222-2222-2222-222222222222",
  };
  const sourceConstant = {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Limit",
    symbol: "const_limit_source",
    value: 10,
  };
  const targetConstant = {
    ...sourceConstant,
    id: "44444444-4444-4444-4444-444444444444",
  };
  mockScriptEventClipboard({
    script: ["sourceEvent"],
    scriptEvents: [
      {
        id: "sourceEvent",
        command: "EVENT_TEST",
        args: {
          variable: { type: "variable", value: sourceVariable.id },
          constant: { type: "constant", value: sourceConstant.id },
        },
      },
    ],
    variables: [sourceVariable],
    constants: [sourceConstant],
    customEvents: [],
  });
  const baseState = clipboardResourceState([targetVariable], [targetConstant]);
  const targetEvent = { id: "targetEvent", command: "EVENT_TEST", args: {} };
  const state = {
    ...baseState,
    project: {
      present: {
        entities: {
          ...baseState.project.present.entities,
          scriptEvents: {
            entities: { [targetEvent.id]: targetEvent },
            ids: [targetEvent.id],
          },
        },
      },
    },
  } as unknown as RootState;
  const dispatch = jest.fn();
  const store = {
    getState: () => state,
    dispatch,
  } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;

  await runThunk(
    store,
    clipboardActions.pasteScriptEventValues({
      scriptEventId: targetEvent.id,
    }),
  );

  const editAction = dispatch.mock.calls
    .map(([action]) => action)
    .find(entitiesActions.editScriptEvent.match);
  expect(editAction?.payload.changes.args).toMatchObject({
    variable: { value: targetVariable.id },
    constant: { value: targetConstant.id },
  });
});

test("Should preserve and remap local array variables when pasting actors", async () => {
  const actor = {
    ...dummyActorNormalized,
    id: "sourceActor",
    script: ["event1"],
  };
  const localVariable = {
    id: `${actor.id}_L0`,
    name: "Inventory",
    symbol: "var_inventory",
    type: "array" as const,
    size: 7,
    flags: { persistent: "true" },
  };
  const event = {
    id: "event1",
    command: "EVENT_TEST",
    args: {
      variable: { type: "variable", value: localVariable.id },
    },
  };
  mockedClipboard.readBuffer.mockImplementation((format) =>
    Promise.resolve(
      format === ClipboardTypeActors
        ? Buffer.from(
            JSON.stringify({
              actors: [actor],
              scriptEvents: [event],
              variables: [localVariable],
              constants: [],
              customEvents: [],
              actorPrefabs: [],
            }),
            "utf8",
          )
        : Buffer.from(""),
    ),
  );
  const baseState = clipboardResourceState();
  const state = {
    ...baseState,
    project: {
      present: {
        entities: {
          ...baseState.project.present.entities,
          actorPrefabs: { entities: {}, ids: [] },
        },
      },
    },
  } as unknown as RootState;
  const dispatch = jest.fn();
  const store = {
    getState: () => state,
    dispatch,
  } as unknown as MiddlewareAPI<Dispatch<UnknownAction>, RootState>;

  await runThunk(
    store,
    clipboardActions.pasteActorAt({ sceneId: "scene1", x: 0, y: 0 }),
  );

  const actions = dispatch.mock.calls.map(([action]) => action);
  const addActorAction = actions.find(entitiesActions.addActor.match);
  const targetVariableId = `${addActorAction?.payload.actorId}_L0`;
  expect(
    actions.find(entitiesActions.addVariable.match)?.payload.variableId,
  ).toBe(targetVariableId);
  expect(actions).toContainEqual(
    entitiesActions.setVariableType({
      variableId: targetVariableId,
      type: "array",
    }),
  );
  expect(actions).toContainEqual(
    entitiesActions.setVariableSize({
      variableId: targetVariableId,
      size: 7,
    }),
  );
  expect(actions).toContainEqual(
    entitiesActions.renameVariableFlags({
      variableId: targetVariableId,
      flags: localVariable.flags,
    }),
  );
  expect(
    actions.find(entitiesActions.addScriptEvents.match)?.payload.data[0].args,
  ).toMatchObject({ variable: { value: targetVariableId } });
});

import middleware from "../../../../src/store/features/clipboard/clipboardMiddleware";
import actions from "../../../../src/store/features/clipboard/clipboardActions";
import { RootState } from "store/storeTypes";
import {
  dummyActorNormalized,
  dummyCustomEventNormalized,
  dummySceneNormalized,
  dummyTriggerNormalized,
} from "../../../dummydata";
import { MiddlewareAPI, Dispatch, UnknownAction } from "@reduxjs/toolkit";
import {
  ClipboardTypeActors,
  ClipboardTypeScenes,
} from "../../../../src/store/features/clipboard/clipboardTypes";
import API from "../../../__mocks__/apiMock";
import entitiesActions from "../../../../src/store/features/entities/entitiesActions";
import { loadScriptEventHandlerFromTrustedString } from "lib/scriptEventsHandlers/trustedHandler";

jest.mock("../../../__mocks__/apiMock");

const mockedAPI = jest.mocked(API);
const mockedClipboard = mockedAPI.clipboard;

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

  const next = jest.fn();
  const action = actions.copyActors({
    actorIds: [dummyActorNormalized.id],
  });

  await middleware(store)(next)(action);

  expect(next).toHaveBeenCalledWith(action);
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

  const next = jest.fn();
  const action = actions.copyActors({
    actorIds: [dummyActorNormalized.id],
  });

  await middleware(store)(next)(action);

  expect(next).toHaveBeenCalledWith(action);
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

  await middleware(store)(jest.fn())(actions.pasteSceneAt({ x: 0, y: 0 }));

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

  await middleware(store)(jest.fn())(actions.pasteSceneAt({ x: 0, y: 0 }));

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

  await middleware(store)(jest.fn())(actions.pasteSceneAt({ x: 0, y: 0 }));

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

  await middleware(store)(jest.fn())(actions.pasteSceneAt({ x: 0, y: 0 }));

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

  await middleware(store)(jest.fn())(actions.pasteSceneAt({ x: 0, y: 0 }));

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

  await middleware(store)(jest.fn())(actions.pasteSceneAt({ x: 0, y: 0 }));

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

  await middleware(store)(jest.fn())(actions.pasteSceneAt({ x: 0, y: 0 }));

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

  await middleware(store)(jest.fn())(actions.pasteSceneAt({ x: 0, y: 0 }));

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

  await middleware(store)(jest.fn())(actions.pasteSceneAt({ x: 0, y: 0 }));

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

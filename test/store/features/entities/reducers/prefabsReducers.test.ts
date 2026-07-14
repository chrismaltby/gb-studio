/* eslint-disable camelcase */
import reducer, { initialState } from "store/features/entities/entitiesState";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import {
  dummyActorNormalized,
  dummyTriggerNormalized,
  dummyActorPrefabNormalized,
  dummyVariable,
  dummyTriggerPrefabNormalized,
} from "../../../../dummydata";
import entitiesActions from "store/features/entities/entitiesActions";
import { v4 as uuid } from "uuid";

jest.mock("uuid");

const mockUuid = uuid as unknown as jest.MockedFunction<() => string>;

beforeEach(() => {
  let id = 0;

  mockUuid.mockImplementation(() => {
    id += 1;
    return `uuid-${id}`;
  });
});

afterEach(() => {
  mockUuid.mockReset();
});

describe("Actor Prefabs", () => {
  describe("unpackActorPrefab", () => {
    test("Should unpack actor prefab when prefab exists", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabId: "prefab1",
              spriteSheetId: "sprite1",
            },
          },
          ids: ["actor1"],
        },
        actorPrefabs: {
          entities: {
            prefab1: {
              ...dummyActorPrefabNormalized,
              id: "prefab1",
              spriteSheetId: "sprite2",
            },
          },
          ids: ["prefab1"],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.unpackActorPrefab({
        actorId: "actor1",
      });

      const newState = reducer(state, action);

      expect(newState.actors.entities["actor1"]?.prefabId).toBe("");
      expect(newState.actors.entities["actor1"]?.spriteSheetId).toEqual(
        "sprite2",
      );
    });

    test("Should not unpack actor prefab when actor does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {},
          ids: [],
        },
        actorPrefabs: {
          entities: {
            prefab1: {
              ...dummyActorPrefabNormalized,
              id: "prefab1",
            },
          },
          ids: ["prefab1"],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.unpackActorPrefab({
        actorId: "nonexistent_actor",
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should not unpack actor prefab when prefab does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabId: "nonexistent_prefab",
              prefabScriptOverrides: {},
            },
          },
          ids: ["actor1"],
        },
        actorPrefabs: {
          entities: {},
          ids: [],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.unpackActorPrefab({
        actorId: "actor1",
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should unpack actor prefab and duplicate local variables", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabId: "prefab1",
            },
          },
          ids: ["actor1"],
        },
        actorPrefabs: {
          entities: {
            prefab1: {
              ...dummyActorPrefabNormalized,
              id: "prefab1",
            },
          },
          ids: ["prefab1"],
        },
        variables: {
          entities: {
            prefab1__L0: {
              ...dummyVariable,
              id: "prefab1__L0",
              name: "Local Variable 0",
            },
          },
          ids: ["prefab1__L0"],
        },
      };

      const action = entitiesActions.unpackActorPrefab({
        actorId: "actor1",
      });

      const newState = reducer(state, action);

      expect(newState.variables.entities["actor1__L0"]).toBeTruthy();
      expect(newState.variables.entities["actor1__L0"]?.name).toBe(
        "Local Variable 0",
      );
      expect(newState.variables.entities["prefab1__L0"]).toBeTruthy();
      expect(newState.variables.entities["prefab1__L0"]?.name).toBe(
        "Local Variable 0",
      );
    });

    test("Should remove unused local variables when unpacking prefab", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabId: "prefab1",
            },
          },
          ids: ["actor1"],
        },
        actorPrefabs: {
          entities: {
            prefab1: {
              ...dummyActorPrefabNormalized,
              id: "prefab1",
            },
          },
          ids: ["prefab1"],
        },
        variables: {
          entities: {
            actor1__L0: {
              ...dummyVariable,
              id: "actor1__L0",
              name: "Local Variable 0",
            },
            actor1__L1: {
              ...dummyVariable,
              id: "actor1__L1",
              name: "Local Variable 1",
            },
            prefab1__L2: {
              ...dummyVariable,
              id: "prefab1__L2",
              name: "Local Variable 2",
            },
          },
          ids: ["actor1__L0", "actor1__L1"],
        },
      };

      const action = entitiesActions.unpackActorPrefab({
        actorId: "actor1",
      });

      const newState = reducer(state, action);

      expect(newState.variables.entities["actor1__L0"]).toBeUndefined();
      expect(newState.variables.entities["actor1__L1"]).toBeUndefined();
      expect(newState.variables.entities["actor1__L2"]).toBeTruthy();
      expect(newState.variables.entities["actor1__L2"]?.name).toBe(
        "Local Variable 2",
      );
    });

    test("Should keep unpack script when unpacking actor prefab", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabId: "prefab1",
            },
          },
          ids: ["actor1"],
        },
        actorPrefabs: {
          entities: {
            prefab1: {
              ...dummyActorPrefabNormalized,
              id: "prefab1",
              script: ["script1"],
            },
          },
          ids: ["prefab1"],
        },
        scriptEvents: {
          entities: {
            script1: {
              id: "script1",
              command: "CMD",
              args: {
                foo: "bar",
                hello: "world",
              },
            },
          },
          ids: ["script1"],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.unpackActorPrefab({
        actorId: "actor1",
      });

      const newState = reducer(state, action);

      expect(newState.actors.entities["actor1"]?.prefabId).toBe("");
      expect(newState.scriptEvents.ids.length).toEqual(2);

      const newScriptEventId =
        newState.actors.entities["actor1"]?.script[0] ?? "";

      expect(newState.scriptEvents.entities[newScriptEventId]).toEqual({
        id: newScriptEventId,
        command: "CMD",
        args: {
          foo: "bar",
          hello: "world",
        },
        children: {},
      });
    });

    test("Should keep script overrides when unpacking actor prefab", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabId: "prefab1",
              prefabScriptOverrides: {
                script1: {
                  id: "script1",
                  args: {
                    foo: "baz",
                  },
                },
              },
            },
          },
          ids: ["actor1"],
        },
        actorPrefabs: {
          entities: {
            prefab1: {
              ...dummyActorPrefabNormalized,
              id: "prefab1",
              script: ["script1"],
            },
          },
          ids: ["prefab1"],
        },
        scriptEvents: {
          entities: {
            script1: {
              id: "script1",
              command: "CMD",
              args: {
                foo: "bar",
                hello: "world",
              },
            },
          },
          ids: ["script1"],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.unpackActorPrefab({
        actorId: "actor1",
      });

      const newState = reducer(state, action);

      expect(newState.actors.entities["actor1"]?.prefabId).toBe("");
      expect(newState.scriptEvents.ids.length).toEqual(2);

      const newScriptEventId =
        newState.actors.entities["actor1"]?.script[0] ?? "";

      expect(newState.scriptEvents.entities[newScriptEventId]).toEqual({
        id: newScriptEventId,
        command: "CMD",
        args: {
          foo: "baz",
          hello: "world",
        },
        children: {},
      });
    });
  });

  describe("convertActorToPrefab", () => {
    let uuidCount = 0;
    (uuid as jest.Mock).mockImplementation(() => "uuid_" + uuidCount++);

    test("Should convert actor to prefab and update actor's prefabId", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabId: "",
              spriteSheetId: "sprite1",
            },
          },
          ids: ["actor1"],
        },
        actorPrefabs: {
          entities: {},
          ids: [],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.convertActorToPrefab({
        actorId: "actor1",
      });

      const newState = reducer(state, action);

      const newPrefabId = newState.actors.entities["actor1"]?.prefabId ?? "";
      expect(newPrefabId).toBeTruthy();
      expect(newState.actorPrefabs.entities[newPrefabId]).toBeTruthy();
      expect(
        newState.actorPrefabs.entities[newPrefabId]?.spriteSheetId,
      ).toEqual("sprite1");
    });

    test("Should not convert actor to prefab if actor does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
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
      };

      const action = entitiesActions.convertActorToPrefab({
        actorId: "nonexistent_actor",
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should not convert actor to prefab if actor is already a prefab", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabId: "prefab1",
            },
          },
          ids: ["actor1"],
        },
        actorPrefabs: {
          entities: {
            prefab1: {
              ...dummyActorPrefabNormalized,
              id: "prefab1",
            },
          },
          ids: ["prefab1"],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.convertActorToPrefab({
        actorId: "actor1",
      });

      const newState = reducer(state, action);

      expect(newState.actorPrefabs.ids.length).toBe(1);
      expect(newState.actors.entities["actor1"]?.prefabId).toBe("prefab1");
    });

    test("Should duplicate local variables when converting actor to prefab", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabId: "",
            },
          },
          ids: ["actor1"],
        },
        actorPrefabs: {
          entities: {},
          ids: [],
        },
        variables: {
          entities: {
            actor1__L0: {
              ...dummyVariable,
              id: "actor1__L0",
              name: "Local Variable 0",
            },
          },
          ids: ["actor1__L0"],
        },
      };

      const action = entitiesActions.convertActorToPrefab({
        actorId: "actor1",
      });

      const newState = reducer(state, action);

      const newPrefabId = newState.actors.entities["actor1"]?.prefabId;
      expect(newState.variables.entities[`${newPrefabId}__L0`]).toBeTruthy();
      expect(newState.variables.entities[`${newPrefabId}__L0`]?.name).toBe(
        "Local Variable 0",
      );
      expect(newState.variables.entities["actor1__L0"]).toBeTruthy();
      expect(newState.variables.entities["actor1__L0"]?.name).toBe(
        "Local Variable 0",
      );
    });
  });

  describe("editActorPrefabScriptEventOverride", () => {
    test("Should add a new script event override if none exists", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {},
            },
          },
          ids: ["actor1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "SOME_COMMAND",
              args: {},
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.editActorPrefabScriptEventOverride({
        actorId: "actor1",
        scriptEventId: "event1",
        args: { arg1: "value1" },
      });

      const newState = reducer(state, action);

      expect(
        newState.actors.entities["actor1"]?.prefabScriptOverrides,
      ).toHaveProperty("event1");
      expect(
        newState.actors.entities["actor1"]?.prefabScriptOverrides?.event1?.args,
      ).toEqual({
        arg1: "value1",
      });
    });

    test("Should update an existing script event override with new args", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "oldValue" },
                },
              },
            },
          },
          ids: ["actor1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "SOME_COMMAND",
              args: {},
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.editActorPrefabScriptEventOverride({
        actorId: "actor1",
        scriptEventId: "event1",
        args: { arg1: "newValue" },
      });

      const newState = reducer(state, action);

      expect(
        newState.actors.entities["actor1"]?.prefabScriptOverrides?.event1?.args,
      ).toEqual({
        arg1: "newValue",
      });
    });

    test("Should add new args to an existing script event override", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "value1" },
                },
              },
            },
          },
          ids: ["actor1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "SOME_COMMAND",
              args: {},
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.editActorPrefabScriptEventOverride({
        actorId: "actor1",
        scriptEventId: "event1",
        args: { arg2: "value2" },
      });

      const newState = reducer(state, action);

      expect(
        newState.actors.entities["actor1"]?.prefabScriptOverrides?.event1?.args,
      ).toEqual({
        arg1: "value1",
        arg2: "value2",
      });
    });

    test("Should not modify the state if actor does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {},
          ids: [],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "SOME_COMMAND",
              args: {},
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.editActorPrefabScriptEventOverride({
        actorId: "nonexistent_actor",
        scriptEventId: "event1",
        args: { arg1: "value1" },
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should not modify the state if script event does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {},
            },
          },
          ids: ["actor1"],
        },
        scriptEvents: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.editActorPrefabScriptEventOverride({
        actorId: "actor1",
        scriptEventId: "nonexistent_event",
        args: { arg1: "value1" },
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });
  });

  describe("revertActorPrefabScriptEventOverrides", () => {
    test("Should clear all script event overrides for an actor", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "value1" },
                },
                event2: {
                  id: "event2",
                  args: { arg2: "value2" },
                },
              },
            },
          },
          ids: ["actor1"],
        },
      };

      const action = entitiesActions.revertActorPrefabScriptEventOverrides({
        actorId: "actor1",
      });

      const newState = reducer(state, action);

      expect(newState.actors.entities["actor1"]?.prefabScriptOverrides).toEqual(
        {},
      );
    });

    test("Should not modify state if actor does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.revertActorPrefabScriptEventOverrides({
        actorId: "nonexistent_actor",
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should handle case when actor has no overrides initially", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {},
            },
          },
          ids: ["actor1"],
        },
      };

      const action = entitiesActions.revertActorPrefabScriptEventOverrides({
        actorId: "actor1",
      });

      const newState = reducer(state, action);

      expect(newState.actors.entities["actor1"]?.prefabScriptOverrides).toEqual(
        {},
      );
    });
  });

  describe("revertActorPrefabScriptEventOverride", () => {
    test("Should remove a specific script event override for an actor", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "value1" },
                },
                event2: {
                  id: "event2",
                  args: { arg2: "value2" },
                },
              },
            },
          },
          ids: ["actor1"],
        },
      };

      const action = entitiesActions.revertActorPrefabScriptEventOverride({
        actorId: "actor1",
        scriptEventId: "event1",
      });

      const newState = reducer(state, action);

      expect(
        newState.actors.entities["actor1"]?.prefabScriptOverrides,
      ).not.toHaveProperty("event1");
      expect(
        newState.actors.entities["actor1"]?.prefabScriptOverrides,
      ).toHaveProperty("event2");
    });

    test("Should not modify state if actor does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.revertActorPrefabScriptEventOverride({
        actorId: "nonexistent_actor",
        scriptEventId: "event1",
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should handle case when specific script event override does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {
                event2: {
                  id: "event2",
                  args: { arg2: "value2" },
                },
              },
            },
          },
          ids: ["actor1"],
        },
      };

      const action = entitiesActions.revertActorPrefabScriptEventOverride({
        actorId: "actor1",
        scriptEventId: "event1",
      });

      const newState = reducer(state, action);

      expect(
        newState.actors.entities["actor1"]?.prefabScriptOverrides,
      ).toHaveProperty("event2");
      expect(
        newState.actors.entities["actor1"]?.prefabScriptOverrides,
      ).not.toHaveProperty("event1");
    });

    test("Should remove the override and leave others intact", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "value1" },
                },
                event2: {
                  id: "event2",
                  args: { arg2: "value2" },
                },
                event3: {
                  id: "event3",
                  args: { arg3: "value3" },
                },
              },
            },
          },
          ids: ["actor1"],
        },
      };

      const action = entitiesActions.revertActorPrefabScriptEventOverride({
        actorId: "actor1",
        scriptEventId: "event2",
      });

      const newState = reducer(state, action);

      expect(newState.actors.entities["actor1"]?.prefabScriptOverrides).toEqual(
        {
          event1: { id: "event1", args: { arg1: "value1" } },
          event3: { id: "event3", args: { arg3: "value3" } },
        },
      );
    });
  });

  describe("applyActorPrefabScriptEventOverrides", () => {
    test("Should apply script event overrides and clear them from the actor", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "newValue1" },
                },
                event2: {
                  id: "event2",
                  args: { arg2: "newValue2" },
                },
              },
            },
          },
          ids: ["actor1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: { arg1: "oldValue1", arg3: "value3" },
            },
            event2: {
              id: "event2",
              command: "CMD",
              args: { arg2: "oldValue2", arg4: "value4" },
            },
          },
          ids: ["event1", "event2"],
        },
      };

      const action = entitiesActions.applyActorPrefabScriptEventOverrides({
        actorId: "actor1",
      });

      const newState = reducer(state, action);

      expect(newState.scriptEvents.entities["event1"]?.args).toEqual({
        arg1: "newValue1",
        arg3: "value3",
      });
      expect(newState.scriptEvents.entities["event2"]?.args).toEqual({
        arg2: "newValue2",
        arg4: "value4",
      });
      expect(newState.actors.entities["actor1"]?.prefabScriptOverrides).toEqual(
        {},
      );
    });

    test("Should not modify state if actor does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {},
          ids: [],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: { arg1: "oldValue1", arg3: "value3" },
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.applyActorPrefabScriptEventOverrides({
        actorId: "nonexistent_actor",
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should handle case when script event does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "newValue1" },
                },
                nonexistentEvent: {
                  id: "nonexistentEvent",
                  args: { arg2: "newValue2" },
                },
              },
            },
          },
          ids: ["actor1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: { arg1: "oldValue1", arg3: "value3" },
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.applyActorPrefabScriptEventOverrides({
        actorId: "actor1",
      });

      const newState = reducer(state, action);

      expect(newState.scriptEvents.entities["event1"]?.args).toEqual({
        arg1: "newValue1",
        arg3: "value3",
      });
      expect(
        newState.scriptEvents.entities["nonexistentEvent"],
      ).toBeUndefined();
      expect(newState.actors.entities["actor1"]?.prefabScriptOverrides).toEqual(
        {},
      );
    });

    test("Should apply overrides correctly even if there are no existing args", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "newValue1" },
                },
              },
            },
          },
          ids: ["actor1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: {},
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.applyActorPrefabScriptEventOverrides({
        actorId: "actor1",
      });

      const newState = reducer(state, action);

      expect(newState.scriptEvents.entities["event1"]?.args).toEqual({
        arg1: "newValue1",
      });
      expect(newState.actors.entities["actor1"]?.prefabScriptOverrides).toEqual(
        {},
      );
    });
  });

  describe("applyActorPrefabScriptEventOverride", () => {
    test("Should apply a specific script event override and remove it from the actor", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "newValue1" },
                },
                event2: {
                  id: "event2",
                  args: { arg2: "newValue2" },
                },
              },
            },
          },
          ids: ["actor1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: { arg1: "oldValue1", arg3: "value3" },
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.applyActorPrefabScriptEventOverride({
        actorId: "actor1",
        scriptEventId: "event1",
      });

      const newState = reducer(state, action);

      expect(newState.scriptEvents.entities["event1"]?.args).toEqual({
        arg1: "newValue1",
        arg3: "value3",
      });
      expect(
        newState.actors.entities["actor1"]?.prefabScriptOverrides,
      ).not.toHaveProperty("event1");
      expect(
        newState.actors.entities["actor1"]?.prefabScriptOverrides,
      ).toHaveProperty("event2");
    });

    test("Should not modify state if actor does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {},
          ids: [],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: { arg1: "oldValue1", arg3: "value3" },
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.applyActorPrefabScriptEventOverride({
        actorId: "nonexistent_actor",
        scriptEventId: "event1",
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should handle case when script event does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {
                nonexistentEvent: {
                  id: "nonexistentEvent",
                  args: { arg2: "newValue2" },
                },
              },
            },
          },
          ids: ["actor1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: { arg1: "oldValue1", arg3: "value3" },
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.applyActorPrefabScriptEventOverride({
        actorId: "actor1",
        scriptEventId: "nonexistentEvent",
      });

      const newState = reducer(state, action);

      expect(
        newState.scriptEvents.entities["nonexistentEvent"],
      ).toBeUndefined();
      expect(
        newState.actors.entities["actor1"]?.prefabScriptOverrides,
      ).not.toHaveProperty("nonexistentEvent");
    });

    test("Should apply override correctly and remove it, leaving others intact", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "newValue1" },
                },
                event2: {
                  id: "event2",
                  args: { arg2: "newValue2" },
                },
              },
            },
          },
          ids: ["actor1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: { arg1: "oldValue1", arg3: "value3" },
            },
            event2: {
              id: "event2",
              command: "CMD",
              args: { arg2: "oldValue2", arg4: "value4" },
            },
          },
          ids: ["event1", "event2"],
        },
      };

      const action = entitiesActions.applyActorPrefabScriptEventOverride({
        actorId: "actor1",
        scriptEventId: "event1",
      });

      const newState = reducer(state, action);

      expect(newState.scriptEvents.entities["event1"]?.args).toEqual({
        arg1: "newValue1",
        arg3: "value3",
      });
      expect(newState.scriptEvents.entities["event2"]?.args).toEqual({
        arg2: "oldValue2",
        arg4: "value4",
      });
      expect(newState.actors.entities["actor1"]?.prefabScriptOverrides).toEqual(
        {
          event2: { id: "event2", args: { arg2: "newValue2" } },
        },
      );
    });
  });
});

describe("Trigger Prefabs", () => {
  describe("unpackTriggerPrefab", () => {
    test("Should keep unpack script when unpacking trigger prefab", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabId: "prefab1",
            },
          },
          ids: ["trigger1"],
        },
        triggerPrefabs: {
          entities: {
            prefab1: {
              ...dummyTriggerPrefabNormalized,
              id: "prefab1",
              script: ["script1"],
            },
          },
          ids: ["prefab1"],
        },
        scriptEvents: {
          entities: {
            script1: {
              id: "script1",
              command: "CMD",
              args: {
                foo: "bar",
                hello: "world",
              },
            },
          },
          ids: ["script1"],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.unpackTriggerPrefab({
        triggerId: "trigger1",
      });

      const newState = reducer(state, action);

      expect(newState.triggers.entities["trigger1"]?.prefabId).toBe("");
      expect(newState.scriptEvents.ids.length).toEqual(2);

      const newScriptEventId =
        newState.triggers.entities["trigger1"]?.script[0] ?? "";

      expect(newState.scriptEvents.entities[newScriptEventId]).toEqual({
        id: newScriptEventId,
        command: "CMD",
        args: {
          foo: "bar",
          hello: "world",
        },
        children: {},
      });
    });

    test("Should not unpack trigger prefab when trigger does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {},
          ids: [],
        },
        triggerPrefabs: {
          entities: {
            prefab1: {
              ...dummyTriggerPrefabNormalized,
              id: "prefab1",
            },
          },
          ids: ["prefab1"],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.unpackTriggerPrefab({
        triggerId: "nonexistent_trigger",
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should not unpack trigger prefab when prefab does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabId: "nonexistent_prefab",
              prefabScriptOverrides: {},
            },
          },
          ids: ["trigger1"],
        },
        triggerPrefabs: {
          entities: {},
          ids: [],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.unpackTriggerPrefab({
        triggerId: "trigger1",
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should unpack trigger prefab and duplicate local variables", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabId: "prefab1",
            },
          },
          ids: ["trigger1"],
        },
        triggerPrefabs: {
          entities: {
            prefab1: {
              ...dummyTriggerPrefabNormalized,
              id: "prefab1",
            },
          },
          ids: ["prefab1"],
        },
        variables: {
          entities: {
            prefab1__L0: {
              ...dummyVariable,
              id: "prefab1__L0",
              name: "Local Variable 0",
            },
          },
          ids: ["prefab1__L0"],
        },
      };

      const action = entitiesActions.unpackTriggerPrefab({
        triggerId: "trigger1",
      });

      const newState = reducer(state, action);

      expect(newState.variables.entities["trigger1__L0"]).toBeTruthy();
      expect(newState.variables.entities["trigger1__L0"]?.name).toBe(
        "Local Variable 0",
      );
      expect(newState.variables.entities["prefab1__L0"]).toBeTruthy();
      expect(newState.variables.entities["prefab1__L0"]?.name).toBe(
        "Local Variable 0",
      );
    });

    test("Should remove unused local variables when unpacking prefab", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabId: "prefab1",
            },
          },
          ids: ["trigger1"],
        },
        triggerPrefabs: {
          entities: {
            prefab1: {
              ...dummyTriggerPrefabNormalized,
              id: "prefab1",
            },
          },
          ids: ["prefab1"],
        },
        variables: {
          entities: {
            trigger1__L0: {
              ...dummyVariable,
              id: "trigger1__L0",
              name: "Local Variable 0",
            },
            trigger1__L1: {
              ...dummyVariable,
              id: "trigger1__L1",
              name: "Local Variable 1",
            },
            prefab1__L2: {
              ...dummyVariable,
              id: "prefab1__L2",
              name: "Local Variable 2",
            },
          },
          ids: ["trigger1__L0", "trigger1__L1"],
        },
      };

      const action = entitiesActions.unpackTriggerPrefab({
        triggerId: "trigger1",
      });

      const newState = reducer(state, action);

      expect(newState.variables.entities["trigger1__L0"]).toBeUndefined();
      expect(newState.variables.entities["trigger1__L1"]).toBeUndefined();
      expect(newState.variables.entities["trigger1__L2"]).toBeTruthy();
      expect(newState.variables.entities["trigger1__L2"]?.name).toBe(
        "Local Variable 2",
      );
    });

    test("Should keep script overrides when unpacking trigger prefab", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabId: "prefab1",
              prefabScriptOverrides: {
                script1: {
                  id: "script1",
                  args: {
                    foo: "baz",
                  },
                },
              },
            },
          },
          ids: ["trigger1"],
        },
        triggerPrefabs: {
          entities: {
            prefab1: {
              ...dummyTriggerPrefabNormalized,
              id: "prefab1",
              script: ["script1"],
            },
          },
          ids: ["prefab1"],
        },
        scriptEvents: {
          entities: {
            script1: {
              id: "script1",
              command: "CMD",
              args: {
                foo: "bar",
                hello: "world",
              },
            },
          },
          ids: ["script1"],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.unpackTriggerPrefab({
        triggerId: "trigger1",
      });

      const newState = reducer(state, action);

      expect(newState.triggers.entities["trigger1"]?.prefabId).toBe("");
      expect(newState.scriptEvents.ids.length).toEqual(2);

      const newScriptEventId =
        newState.triggers.entities["trigger1"]?.script[0] ?? "";

      expect(newState.scriptEvents.entities[newScriptEventId]).toEqual({
        id: newScriptEventId,
        command: "CMD",
        args: {
          foo: "baz",
          hello: "world",
        },
        children: {},
      });
    });
  });

  describe("convertTriggerToPrefab", () => {
    let uuidCount = 0;
    (uuid as jest.Mock).mockImplementation(() => "uuid_" + uuidCount++);

    test("Should convert trigger to prefab and update trigger's prefabId", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabId: "",
            },
          },
          ids: ["trigger1"],
        },
        triggerPrefabs: {
          entities: {},
          ids: [],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.convertTriggerToPrefab({
        triggerId: "trigger1",
      });

      const newState = reducer(state, action);

      const newPrefabId =
        newState.triggers.entities["trigger1"]?.prefabId ?? "";
      expect(newPrefabId).toBeTruthy();
      expect(newState.triggerPrefabs.entities[newPrefabId]).toBeTruthy();
    });

    test("Should not convert trigger to prefab if trigger does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {},
          ids: [],
        },
        triggerPrefabs: {
          entities: {},
          ids: [],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.convertTriggerToPrefab({
        triggerId: "nonexistent_trigger",
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should not convert trigger to prefab if trigger is already a prefab", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabId: "prefab1",
            },
          },
          ids: ["trigger1"],
        },
        triggerPrefabs: {
          entities: {
            prefab1: {
              ...dummyTriggerPrefabNormalized,
              id: "prefab1",
            },
          },
          ids: ["prefab1"],
        },
        variables: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.convertTriggerToPrefab({
        triggerId: "trigger1",
      });

      const newState = reducer(state, action);

      expect(newState.triggerPrefabs.ids.length).toBe(1);
      expect(newState.triggers.entities["trigger1"]?.prefabId).toBe("prefab1");
    });

    test("Should duplicate local variables when converting trigger to prefab", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabId: "",
            },
          },
          ids: ["trigger1"],
        },
        triggerPrefabs: {
          entities: {},
          ids: [],
        },
        variables: {
          entities: {
            trigger1__L0: {
              ...dummyVariable,
              id: "trigger1__L0",
              name: "Local Variable 0",
            },
          },
          ids: ["trigger1__L0"],
        },
      };

      const action = entitiesActions.convertTriggerToPrefab({
        triggerId: "trigger1",
      });

      const newState = reducer(state, action);

      const newPrefabId = newState.triggers.entities["trigger1"]?.prefabId;
      expect(newState.variables.entities[`${newPrefabId}__L0`]).toBeTruthy();
      expect(newState.variables.entities[`${newPrefabId}__L0`]?.name).toBe(
        "Local Variable 0",
      );
      expect(newState.variables.entities["trigger1__L0"]).toBeTruthy();
      expect(newState.variables.entities["trigger1__L0"]?.name).toBe(
        "Local Variable 0",
      );
    });
  });

  describe("editTriggerPrefabScriptEventOverride", () => {
    test("Should add a new script event override if none exists", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {},
            },
          },
          ids: ["trigger1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "SOME_COMMAND",
              args: {},
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.editTriggerPrefabScriptEventOverride({
        triggerId: "trigger1",
        scriptEventId: "event1",
        args: { arg1: "value1" },
      });

      const newState = reducer(state, action);

      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).toHaveProperty("event1");
      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides?.event1
          ?.args,
      ).toEqual({
        arg1: "value1",
      });
    });

    test("Should update an existing script event override with new args", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "oldValue" },
                },
              },
            },
          },
          ids: ["trigger1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "SOME_COMMAND",
              args: {},
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.editTriggerPrefabScriptEventOverride({
        triggerId: "trigger1",
        scriptEventId: "event1",
        args: { arg1: "newValue" },
      });

      const newState = reducer(state, action);

      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides?.event1
          ?.args,
      ).toEqual({
        arg1: "newValue",
      });
    });

    test("Should add new args to an existing script event override", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "value1" },
                },
              },
            },
          },
          ids: ["trigger1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "SOME_COMMAND",
              args: {},
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.editTriggerPrefabScriptEventOverride({
        triggerId: "trigger1",
        scriptEventId: "event1",
        args: { arg2: "value2" },
      });

      const newState = reducer(state, action);

      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides?.event1
          ?.args,
      ).toEqual({
        arg1: "value1",
        arg2: "value2",
      });
    });

    test("Should not modify the state if trigger does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {},
          ids: [],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "SOME_COMMAND",
              args: {},
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.editTriggerPrefabScriptEventOverride({
        triggerId: "nonexistent_trigger",
        scriptEventId: "event1",
        args: { arg1: "value1" },
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should not modify the state if script event does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {},
            },
          },
          ids: ["trigger1"],
        },
        scriptEvents: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.editTriggerPrefabScriptEventOverride({
        triggerId: "trigger1",
        scriptEventId: "nonexistent_event",
        args: { arg1: "value1" },
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });
  });

  describe("revertTriggerPrefabScriptEventOverrides", () => {
    test("Should clear all script event overrides for an trigger", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "value1" },
                },
                event2: {
                  id: "event2",
                  args: { arg2: "value2" },
                },
              },
            },
          },
          ids: ["trigger1"],
        },
      };

      const action = entitiesActions.revertTriggerPrefabScriptEventOverrides({
        triggerId: "trigger1",
      });

      const newState = reducer(state, action);

      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).toEqual({});
    });

    test("Should not modify state if trigger does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.revertTriggerPrefabScriptEventOverrides({
        triggerId: "nonexistent_trigger",
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should handle case when trigger has no overrides initially", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {},
            },
          },
          ids: ["trigger1"],
        },
      };

      const action = entitiesActions.revertTriggerPrefabScriptEventOverrides({
        triggerId: "trigger1",
      });

      const newState = reducer(state, action);

      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).toEqual({});
    });
  });

  describe("revertTriggerPrefabScriptEventOverride", () => {
    test("Should remove a specific script event override for an trigger", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "value1" },
                },
                event2: {
                  id: "event2",
                  args: { arg2: "value2" },
                },
              },
            },
          },
          ids: ["trigger1"],
        },
      };

      const action = entitiesActions.revertTriggerPrefabScriptEventOverride({
        triggerId: "trigger1",
        scriptEventId: "event1",
      });

      const newState = reducer(state, action);

      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).not.toHaveProperty("event1");
      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).toHaveProperty("event2");
    });

    test("Should not modify state if trigger does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.revertTriggerPrefabScriptEventOverride({
        triggerId: "nonexistent_trigger",
        scriptEventId: "event1",
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should handle case when specific script event override does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {
                event2: {
                  id: "event2",
                  args: { arg2: "value2" },
                },
              },
            },
          },
          ids: ["trigger1"],
        },
      };

      const action = entitiesActions.revertTriggerPrefabScriptEventOverride({
        triggerId: "trigger1",
        scriptEventId: "event1",
      });

      const newState = reducer(state, action);

      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).toHaveProperty("event2");
      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).not.toHaveProperty("event1");
    });

    test("Should remove the override and leave others intact", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "value1" },
                },
                event2: {
                  id: "event2",
                  args: { arg2: "value2" },
                },
                event3: {
                  id: "event3",
                  args: { arg3: "value3" },
                },
              },
            },
          },
          ids: ["trigger1"],
        },
      };

      const action = entitiesActions.revertTriggerPrefabScriptEventOverride({
        triggerId: "trigger1",
        scriptEventId: "event2",
      });

      const newState = reducer(state, action);

      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).toEqual({
        event1: { id: "event1", args: { arg1: "value1" } },
        event3: { id: "event3", args: { arg3: "value3" } },
      });
    });
  });

  describe("applyTriggerPrefabScriptEventOverrides", () => {
    test("Should apply script event overrides and clear them from the trigger", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "newValue1" },
                },
                event2: {
                  id: "event2",
                  args: { arg2: "newValue2" },
                },
              },
            },
          },
          ids: ["trigger1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: { arg1: "oldValue1", arg3: "value3" },
            },
            event2: {
              id: "event2",
              command: "CMD",
              args: { arg2: "oldValue2", arg4: "value4" },
            },
          },
          ids: ["event1", "event2"],
        },
      };

      const action = entitiesActions.applyTriggerPrefabScriptEventOverrides({
        triggerId: "trigger1",
      });

      const newState = reducer(state, action);

      expect(newState.scriptEvents.entities["event1"]?.args).toEqual({
        arg1: "newValue1",
        arg3: "value3",
      });
      expect(newState.scriptEvents.entities["event2"]?.args).toEqual({
        arg2: "newValue2",
        arg4: "value4",
      });
      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).toEqual({});
    });

    test("Should not modify state if trigger does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {},
          ids: [],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: { arg1: "oldValue1", arg3: "value3" },
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.applyTriggerPrefabScriptEventOverrides({
        triggerId: "nonexistent_trigger",
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should handle case when script event does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "newValue1" },
                },
                nonexistentEvent: {
                  id: "nonexistentEvent",
                  args: { arg2: "newValue2" },
                },
              },
            },
          },
          ids: ["trigger1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: { arg1: "oldValue1", arg3: "value3" },
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.applyTriggerPrefabScriptEventOverrides({
        triggerId: "trigger1",
      });

      const newState = reducer(state, action);

      expect(newState.scriptEvents.entities["event1"]?.args).toEqual({
        arg1: "newValue1",
        arg3: "value3",
      });
      expect(
        newState.scriptEvents.entities["nonexistentEvent"],
      ).toBeUndefined();
      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).toEqual({});
    });

    test("Should apply overrides correctly even if there are no existing args", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "newValue1" },
                },
              },
            },
          },
          ids: ["trigger1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: {},
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.applyTriggerPrefabScriptEventOverrides({
        triggerId: "trigger1",
      });

      const newState = reducer(state, action);

      expect(newState.scriptEvents.entities["event1"]?.args).toEqual({
        arg1: "newValue1",
      });
      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).toEqual({});
    });
  });

  describe("applyTriggerPrefabScriptEventOverride", () => {
    test("Should apply a specific script event override and remove it from the trigger", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "newValue1" },
                },
                event2: {
                  id: "event2",
                  args: { arg2: "newValue2" },
                },
              },
            },
          },
          ids: ["trigger1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: { arg1: "oldValue1", arg3: "value3" },
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.applyTriggerPrefabScriptEventOverride({
        triggerId: "trigger1",
        scriptEventId: "event1",
      });

      const newState = reducer(state, action);

      expect(newState.scriptEvents.entities["event1"]?.args).toEqual({
        arg1: "newValue1",
        arg3: "value3",
      });
      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).not.toHaveProperty("event1");
      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).toHaveProperty("event2");
    });

    test("Should not modify state if trigger does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {},
          ids: [],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: { arg1: "oldValue1", arg3: "value3" },
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.applyTriggerPrefabScriptEventOverride({
        triggerId: "nonexistent_trigger",
        scriptEventId: "event1",
      });

      const newState = reducer(state, action);

      expect(newState).toEqual(state);
    });

    test("Should handle case when script event does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {
                nonexistentEvent: {
                  id: "nonexistentEvent",
                  args: { arg2: "newValue2" },
                },
              },
            },
          },
          ids: ["trigger1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: { arg1: "oldValue1", arg3: "value3" },
            },
          },
          ids: ["event1"],
        },
      };

      const action = entitiesActions.applyTriggerPrefabScriptEventOverride({
        triggerId: "trigger1",
        scriptEventId: "nonexistentEvent",
      });

      const newState = reducer(state, action);

      expect(
        newState.scriptEvents.entities["nonexistentEvent"],
      ).toBeUndefined();
      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).not.toHaveProperty("nonexistentEvent");
    });

    test("Should apply override correctly and remove it, leaving others intact", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {
                event1: {
                  id: "event1",
                  args: { arg1: "newValue1" },
                },
                event2: {
                  id: "event2",
                  args: { arg2: "newValue2" },
                },
              },
            },
          },
          ids: ["trigger1"],
        },
        scriptEvents: {
          entities: {
            event1: {
              id: "event1",
              command: "CMD",
              args: { arg1: "oldValue1", arg3: "value3" },
            },
            event2: {
              id: "event2",
              command: "CMD",
              args: { arg2: "oldValue2", arg4: "value4" },
            },
          },
          ids: ["event1", "event2"],
        },
      };

      const action = entitiesActions.applyTriggerPrefabScriptEventOverride({
        triggerId: "trigger1",
        scriptEventId: "event1",
      });

      const newState = reducer(state, action);

      expect(newState.scriptEvents.entities["event1"]?.args).toEqual({
        arg1: "newValue1",
        arg3: "value3",
      });
      expect(newState.scriptEvents.entities["event2"]?.args).toEqual({
        arg2: "oldValue2",
        arg4: "value4",
      });
      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides,
      ).toEqual({
        event2: { id: "event2", args: { arg2: "newValue2" } },
      });
    });
  });
});

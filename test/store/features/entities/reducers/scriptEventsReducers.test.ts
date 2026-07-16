import reducer, { initialState } from "store/features/entities/entitiesState";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import entitiesActions from "store/features/entities/entitiesActions";
import {
  dummyActorNormalized,
  dummyTriggerNormalized,
} from "../../../../dummydata";

jest.mock("uuid");

describe("Script Event Presets", () => {
  describe("applyScriptEventPresetChanges", () => {
    test("Should update script event arguments based on preset changes", () => {
      const state: EntitiesState = {
        ...initialState,
        scriptEvents: {
          entities: {
            scriptEvent1: {
              id: "scriptEvent1",
              command: "EVENT_SOME_COMMAND",
              args: {
                __presetId: "preset1",
                someArg: "initialValue",
                otherArg: "toRemain",
              },
            },
          },
          ids: ["scriptEvent1"],
        },
      };

      const action = entitiesActions.applyScriptEventPresetChanges({
        id: "EVENT_SOME_COMMAND",
        presetId: "preset1",
        name: "Updated Preset",
        groups: ["group1"],
        args: { someArg: "newValue" },
        previousArgs: { someArg: "initialValue" },
      });

      const newState = reducer(state, action);

      expect(
        newState.scriptEvents.entities["scriptEvent1"]?.args?.someArg,
      ).toBe("newValue");
      expect(
        newState.scriptEvents.entities["scriptEvent1"]?.args?.otherArg,
      ).toBe("toRemain");
    });

    test("Should not update script event arguments if preset ID does not match", () => {
      const state: EntitiesState = {
        ...initialState,
        scriptEvents: {
          entities: {
            scriptEvent1: {
              id: "scriptEvent1",
              command: "EVENT_SOME_COMMAND",
              args: {
                __presetId: "preset1",
                someArg: "initialValue",
              },
            },
          },
          ids: ["scriptEvent1"],
        },
      };

      const action = entitiesActions.applyScriptEventPresetChanges({
        id: "EVENT_SOME_COMMAND",
        presetId: "preset2", // Different preset ID
        name: "Updated Preset",
        groups: ["group1"],
        args: { someArg: "newValue" },
        previousArgs: { someArg: "initialValue" },
      });

      const newState = reducer(state, action);

      expect(
        newState.scriptEvents.entities["scriptEvent1"]?.args?.someArg,
      ).toBe("initialValue");
    });

    test("Should update actor prefab script overrides based on preset changes", () => {
      const state: EntitiesState = {
        ...initialState,
        actors: {
          entities: {
            actor1: {
              ...dummyActorNormalized,
              id: "actor1",
              prefabScriptOverrides: {
                override1: {
                  id: "event1",
                  args: {
                    __presetId: "preset1",
                    someArg: "initialValue",
                  },
                },
              },
            },
          },
          ids: ["actor1"],
        },
      };

      const action = entitiesActions.applyScriptEventPresetChanges({
        id: "EVENT_SOME_COMMAND",
        presetId: "preset1",
        name: "Updated Preset",
        groups: ["group1"],
        args: { someArg: "newValue" },
        previousArgs: { someArg: "initialValue" },
      });

      const newState = reducer(state, action);

      expect(
        newState.actors.entities["actor1"]?.prefabScriptOverrides.override1
          ?.args?.someArg,
      ).toBe("newValue");
    });

    test("Should update trigger prefab script overrides based on preset changes", () => {
      const state: EntitiesState = {
        ...initialState,
        triggers: {
          entities: {
            trigger1: {
              ...dummyTriggerNormalized,
              id: "trigger1",
              prefabScriptOverrides: {
                override1: {
                  id: "event1",
                  args: {
                    __presetId: "preset1",
                    someArg: "initialValue",
                  },
                },
              },
            },
          },
          ids: ["trigger1"],
        },
      };

      const action = entitiesActions.applyScriptEventPresetChanges({
        id: "EVENT_SOME_COMMAND",
        presetId: "preset1",
        name: "Updated Preset",
        groups: ["group1"],
        args: { someArg: "newValue" },
        previousArgs: { someArg: "initialValue" },
      });

      const newState = reducer(state, action);

      expect(
        newState.triggers.entities["trigger1"]?.prefabScriptOverrides.override1
          ?.args?.someArg,
      ).toBe("newValue");
    });

    test("Should only update arguments that match previous values", () => {
      const state: EntitiesState = {
        ...initialState,
        scriptEvents: {
          entities: {
            scriptEvent1: {
              id: "scriptEvent1",
              command: "EVENT_SOME_COMMAND",
              args: {
                __presetId: "preset1",
                someArg: "unchangedValue",
                otherArg: "initialValue",
              },
            },
          },
          ids: ["scriptEvent1"],
        },
      };

      const action = entitiesActions.applyScriptEventPresetChanges({
        id: "EVENT_SOME_COMMAND",
        presetId: "preset1",
        name: "Updated Preset",
        groups: ["group1"],
        args: { otherArg: "newValue" },
        previousArgs: { otherArg: "initialValue" },
      });

      const newState = reducer(state, action);

      expect(
        newState.scriptEvents.entities["scriptEvent1"]?.args?.someArg,
      ).toBe("unchangedValue");
      expect(
        newState.scriptEvents.entities["scriptEvent1"]?.args?.otherArg,
      ).toBe("newValue");
    });

    test("Should handle cases where no script events, actors, or triggers exist", () => {
      const state: EntitiesState = {
        ...initialState,
        scriptEvents: {
          entities: {},
          ids: [],
        },
        actors: {
          entities: {},
          ids: [],
        },
        triggers: {
          entities: {},
          ids: [],
        },
      };

      const action = entitiesActions.applyScriptEventPresetChanges({
        id: "EVENT_SOME_COMMAND",
        presetId: "preset1",
        name: "Updated Preset",
        groups: ["group1"],
        args: { someArg: "newValue" },
        previousArgs: { someArg: "initialValue" },
      });

      const newState = reducer(state, action);

      // No updates should be made since no entities exist
      expect(newState.scriptEvents.entities).toEqual({});
      expect(newState.actors.entities).toEqual({});
      expect(newState.triggers.entities).toEqual({});
    });
  });
});

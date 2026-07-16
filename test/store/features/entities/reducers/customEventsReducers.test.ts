import reducer, { initialState } from "store/features/entities/entitiesState";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import { dummyCustomEventNormalized } from "../../../../dummydata";
import entitiesActions from "store/features/entities/entitiesActions";

describe("Custom Events", () => {
  test("Should be able to add custom event", () => {
    const state: EntitiesState = {
      ...initialState,
    };

    const action = entitiesActions.addCustomEvent();

    expect(state.customEvents.ids.length).toBe(0);
    const newState = reducer(state, action);
    expect(newState.customEvents.ids.length).toBe(1);
    expect(
      newState.customEvents.entities[action.payload.customEventId]?.name,
    ).toBe("CUSTOM_EVENT 1");
    expect(
      newState.customEvents.entities[action.payload.customEventId]?.script,
    ).toEqual([]);
  });

  describe("removeCustomEvent", () => {
    test("Should remove a custom event and clear references when deleteReferences is false", () => {
      const state: EntitiesState = {
        ...initialState,
        customEvents: {
          entities: {
            customEvent1: {
              ...dummyCustomEventNormalized,
              id: "customEvent1",
            },
          },
          ids: ["customEvent1"],
        },
        scriptEvents: {
          entities: {
            scriptEvent1: {
              id: "scriptEvent1",
              command: "EVENT_CALL_CUSTOM_EVENT",
              args: { customEventId: "customEvent1" },
            },
            scriptEvent2: {
              id: "scriptEvent2",
              command: "EVENT_CALL_CUSTOM_EVENT",
              args: { customEventId: "customEvent1" },
            },
            scriptEvent3: {
              id: "scriptEvent3",
              command: "SOME_OTHER_EVENT",
              args: {},
            },
          },
          ids: ["scriptEvent1", "scriptEvent2", "scriptEvent3"],
        },
      };

      const action = entitiesActions.removeCustomEvent({
        customEventId: "customEvent1",
        deleteReferences: false,
      });

      const newState = reducer(state, action);

      expect(newState.customEvents.entities["customEvent1"]).toBeUndefined();
      expect(newState.scriptEvents.entities["scriptEvent1"]?.id).toEqual(
        "scriptEvent1",
      );
      expect(newState.scriptEvents.entities["scriptEvent2"]?.id).toEqual(
        "scriptEvent2",
      );
      expect(
        newState.scriptEvents.entities["scriptEvent1"]?.args?.customEventId,
      ).toBeUndefined();
      expect(
        newState.scriptEvents.entities["scriptEvent2"]?.args?.customEventId,
      ).toBeUndefined();
      expect(newState.scriptEvents.entities["scriptEvent3"]?.args).toEqual({});
    });

    test("Should remove a custom event and delete references when deleteReferences is true", () => {
      const state: EntitiesState = {
        ...initialState,
        customEvents: {
          entities: {
            customEvent1: {
              ...dummyCustomEventNormalized,
              id: "customEvent1",
            },
          },
          ids: ["customEvent1"],
        },
        scriptEvents: {
          entities: {
            scriptEvent1: {
              id: "scriptEvent1",
              command: "EVENT_CALL_CUSTOM_EVENT",
              args: { customEventId: "customEvent1" },
            },
            scriptEvent2: {
              id: "scriptEvent2",
              command: "EVENT_CALL_CUSTOM_EVENT",
              args: { customEventId: "customEvent1" },
            },
            scriptEvent3: {
              id: "scriptEvent3",
              command: "SOME_OTHER_EVENT",
              args: {},
            },
          },
          ids: ["scriptEvent1", "scriptEvent2", "scriptEvent3"],
        },
      };

      const action = entitiesActions.removeCustomEvent({
        customEventId: "customEvent1",
        deleteReferences: true,
      });

      const newState = reducer(state, action);

      expect(newState.customEvents.entities["customEvent1"]).toBeUndefined();
      expect(newState.scriptEvents.entities["scriptEvent1"]).toBeUndefined();
      expect(newState.scriptEvents.entities["scriptEvent2"]).toBeUndefined();
      expect(newState.scriptEvents.entities["scriptEvent3"]).toBeDefined();
    });

    test("Should handle case when custom event does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        customEvents: {
          entities: {
            customEvent1: {
              ...dummyCustomEventNormalized,
              id: "customEvent1",
            },
          },
          ids: ["customEvent1"],
        },
        scriptEvents: {
          entities: {
            scriptEvent1: {
              id: "scriptEvent1",
              command: "EVENT_CALL_CUSTOM_EVENT",
              args: { customEventId: "customEvent1" },
            },
            scriptEvent2: {
              id: "scriptEvent2",
              command: "EVENT_CALL_CUSTOM_EVENT",
              args: { customEventId: "customEvent1" },
            },
          },
          ids: ["scriptEvent1", "scriptEvent2"],
        },
      };

      const action = entitiesActions.removeCustomEvent({
        customEventId: "nonexistent_custom_event",
        deleteReferences: false,
      });

      const newState = reducer(state, action);

      expect(newState.customEvents.entities["customEvent1"]).toBeDefined();
      expect(
        newState.scriptEvents.entities["scriptEvent1"]?.args?.customEventId,
      ).toBe("customEvent1");
      expect(
        newState.scriptEvents.entities["scriptEvent2"]?.args?.customEventId,
      ).toBe("customEvent1");
    });

    test("Should not modify script events that do not reference the removed custom event", () => {
      const state: EntitiesState = {
        ...initialState,
        customEvents: {
          entities: {
            customEvent1: {
              ...dummyCustomEventNormalized,
              id: "customEvent1",
            },
          },
          ids: ["customEvent1"],
        },
        scriptEvents: {
          entities: {
            scriptEvent1: {
              id: "scriptEvent1",
              command: "EVENT_CALL_CUSTOM_EVENT",
              args: { customEventId: "customEvent1" },
            },
            scriptEvent2: {
              id: "scriptEvent2",
              command: "EVENT_CALL_CUSTOM_EVENT",
              args: { customEventId: "someOtherCustomEvent" },
            },
          },
          ids: ["scriptEvent1", "scriptEvent2"],
        },
      };

      const action = entitiesActions.removeCustomEvent({
        customEventId: "customEvent1",
        deleteReferences: false,
      });

      const newState = reducer(state, action);

      expect(newState.customEvents.entities["customEvent1"]).toBeUndefined();
      expect(
        newState.scriptEvents.entities["scriptEvent1"]?.args?.customEventId,
      ).toBeUndefined();
      expect(
        newState.scriptEvents.entities["scriptEvent2"]?.args?.customEventId,
      ).toBe("someOtherCustomEvent");
    });
  });
});

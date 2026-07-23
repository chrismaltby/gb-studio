import { produce } from "immer";
import { initialState } from "store/features/entities/entitiesState";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import { ensureReferencedVariablesExist } from "store/features/entities/reducers/ensureReferencedVariables";
import { ScriptEventDefs } from "shared/lib/scripts/scriptDefHelpers";
import cloneDeep from "lodash/cloneDeep";

const scriptEventDefs = {
  EVENT_INC_VALUE: {
    fieldsLookup: {
      variable: {
        key: "variable",
        type: "variable",
      },
    },
  },
  EVENT_TEXT: {
    fieldsLookup: {
      text: {
        key: "text",
        type: "textarea",
      },
    },
  },
} as unknown as ScriptEventDefs;

test("Should create entities for script referenced variables that are not defined", () => {
  const state: EntitiesState = cloneDeep({
    ...initialState,
    variables: {
      ids: ["5"],
      entities: {
        "5": {
          id: "5",
          name: "Already Defined",
          symbol: "var_already_defined",
        },
      },
    },
    scriptEvents: {
      ids: ["event1", "event2", "event3"],
      entities: {
        event1: {
          id: "event1",
          command: "EVENT_INC_VALUE",
          args: {
            variable: "5",
          },
        },
        event2: {
          id: "event2",
          command: "EVENT_TEXT",
          args: {
            text: ["Hello $12$ and local $L0$"],
          },
        },
        event3: {
          id: "event3",
          command: "EVENT_CALL_CUSTOM_EVENT",
          args: {
            customEventId: "custom1",
            "$variable[V0]$": "9",
          },
        },
      },
    },
  });

  // Adapter operations only mutate in place when given an immer draft
  // (as when called from within the loadProject reducer)
  const newState = produce(state, (draft) => {
    ensureReferencedVariablesExist(draft, scriptEventDefs);
  });

  // Already defined variable untouched
  expect(newState.variables.entities["5"]?.name).toBe("Already Defined");
  // Dialogue reference created
  expect(newState.variables.entities["12"]).toMatchObject({
    id: "12",
    name: "",
  });
  expect(newState.variables.entities["12"]?.symbol).toBeTruthy();
  // Custom script call argument created
  expect(newState.variables.entities["9"]).toMatchObject({ id: "9", name: "" });
  // Local variables are not global variables
  expect(newState.variables.entities["L0"]).toBeUndefined();
  expect(newState.variables.ids).toHaveLength(3);
});

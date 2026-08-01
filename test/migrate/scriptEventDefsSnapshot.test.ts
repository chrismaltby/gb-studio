import {
  scriptEventDefsFromSnapshot,
  scriptEventDefsToSnapshot,
} from "lib/project/migration/snapshots/scriptEventDefs";
import type { ScriptEventDefs } from "shared/lib/scripts/scriptDefHelpers";

const scriptEventDefs = {
  EVENT_TEST: {
    id: "EVENT_TEST",
    fields: [
      {
        key: "actor",
        type: "actor",
      },
      {
        type: "group",
        label: "Values",
        fields: [
          {
            key: "variable",
            type: "variable",
          },
          {
            key: "value",
            type: "value",
          },
        ],
      },
    ],
    fieldsLookup: {},
    hasAutoLabel: false,
  },
  EVENT_WITHOUT_VARIABLES: {
    id: "EVENT_WITHOUT_VARIABLES",
    fields: [{ key: "actor", type: "actor" }],
    fieldsLookup: {},
    hasAutoLabel: false,
  },
} satisfies ScriptEventDefs;

test("snapshots all fields when no field types are selected", () => {
  expect(scriptEventDefsToSnapshot(scriptEventDefs)).toEqual({
    EVENT_TEST: {
      actor: "actor",
      variable: "variable",
      value: "value",
    },
    EVENT_WITHOUT_VARIABLES: {
      actor: "actor",
    },
  });
});

test("finds selected field types nested inside groups", () => {
  expect(
    scriptEventDefsToSnapshot(scriptEventDefs, ["variable", "value"]),
  ).toEqual({
    EVENT_TEST: {
      variable: "variable",
      value: "value",
    },
  });
});

test("reconstructs a partial field type lookup", () => {
  const snapshot = scriptEventDefsToSnapshot(scriptEventDefs, [
    "variable",
    "value",
  ]);

  expect(scriptEventDefsFromSnapshot(snapshot)).toEqual({
    EVENT_TEST: {
      fieldsLookup: {
        variable: {
          type: "variable",
        },
        value: {
          type: "value",
        },
      },
    },
  });
});

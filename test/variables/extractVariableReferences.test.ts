import type { ScriptEvent } from "shared/lib/resources/types";
import type { ScriptEventDefs } from "shared/lib/scripts/scriptDefHelpers";
import { extractVariableIdsFromScriptEvent } from "shared/lib/variables/extractVariableReferences";

const scriptEventDefs = {
  EVENT_PLUGIN_TEST: {
    fieldsLookup: {
      direct: { type: "variable" },
      element: { type: "variableElement" },
      union: { type: "union" },
      value: { type: "value" },
      text: { type: "text" },
      textarea: { type: "textarea" },
      expression: { type: "matharea" },
      table: { type: "dataTable" },
      references: { type: "references" },
    },
  },
} as unknown as ScriptEventDefs;

test("extracts variable IDs from schema-driven event arguments", () => {
  const scriptEvent: ScriptEvent = {
    id: "event1",
    command: "EVENT_PLUGIN_TEST",
    args: {
      direct: {
        type: "variable",
        value: "12",
        index: {
          type: "add",
          valueA: { type: "variable", value: "26" },
          valueB: { type: "number", value: 1 },
        },
      },
      element: {
        type: "variable",
        value: "34",
        index: { type: "number", value: 2 },
      },
      union: { type: "variable", value: "13" },
      value: {
        type: "add",
        valueA: { type: "variable", value: "14" },
        valueB: { type: "expression", value: "$15$ + 1" },
      },
      text: "%d$016$ #17# %t$18$ %f$19$",
      textarea: ["No variable", "$20$"],
      expression: "$21$[$22$[$27$] + $31$]",
      table: {
        variables: [
          { type: "variable", value: "23" },
          {
            type: "variable",
            value: "33",
            index: { type: "number", value: 2 },
          },
        ],
        rows: [{ values: [{ type: "number", value: 1 }] }],
      },
      references: [
        { type: "variable", id: "24" },
        { type: "sound", id: "sound1" },
      ],
      "$variable[V0]$": { type: "variable", value: "25" },
      "$variable[V1]$": "28",
      "$variable[V2]$": {
        type: "variable",
        value: "29",
        index: {
          type: "add",
          valueA: { type: "variable", value: "30" },
          valueB: { type: "variable", value: "32" },
        },
      },
    },
  };

  expect(
    extractVariableIdsFromScriptEvent(scriptEvent, scriptEventDefs).sort(),
  ).toEqual(
    [
      "12",
      "13",
      "14",
      "15",
      "16",
      "17",
      "18",
      "19",
      "20",
      "21",
      "22",
      "23",
      "24",
      "25",
      "26",
      "27",
      "28",
      "29",
      "30",
      "31",
      "32",
      "33",
      "34",
    ].sort(),
  );
});

test("ignores argument shapes without a matching schema field", () => {
  const scriptEvent: ScriptEvent = {
    id: "event1",
    command: "EVENT_PLUGIN_TEST",
    args: {
      unknown: { type: "variable", value: "12" },
    },
  };

  expect(
    extractVariableIdsFromScriptEvent(scriptEvent, scriptEventDefs),
  ).toEqual([]);
});

test("extracts variable IDs from array set values", () => {
  const defs = {
    EVENT_ARRAY_SET_TEST: {
      fieldsLookup: {
        values: { type: "arraySet" },
      },
    },
  } as unknown as ScriptEventDefs;

  const scriptEvent: ScriptEvent = {
    id: "event1",
    command: "EVENT_ARRAY_SET_TEST",
    args: {
      values: [
        { type: "variable", value: "12" },
        {
          type: "add",
          valueA: { type: "variable", value: "13" },
          valueB: { type: "expression", value: "$14$ + 1" },
        },
        {
          type: "variable",
          value: "15",
          index: {
            type: "add",
            valueA: { type: "variable", value: "16" },
            valueB: { type: "number", value: 1 },
          },
        },
        { type: "number", value: 42 },
      ],
    },
  };

  expect(extractVariableIdsFromScriptEvent(scriptEvent, defs).sort()).toEqual(
    ["12", "13", "14", "15", "16"].sort(),
  );
});

test("ignores invalid array set values", () => {
  const defs = {
    EVENT_ARRAY_SET_TEST: {
      fieldsLookup: {
        values: { type: "arraySet" },
      },
    },
  } as unknown as ScriptEventDefs;

  const scriptEvent: ScriptEvent = {
    id: "event1",
    command: "EVENT_ARRAY_SET_TEST",
    args: {
      values: "not-an-array",
    },
  };

  expect(extractVariableIdsFromScriptEvent(scriptEvent, defs)).toEqual([]);
});

import type { ScriptEvent } from "shared/lib/resources/types";
import type { ScriptEventDefs } from "shared/lib/scripts/scriptDefHelpers";
import { extractVariableIdsFromScriptEvent } from "shared/lib/variables/extractVariableReferences";

const scriptEventDefs = {
  EVENT_PLUGIN_TEST: {
    fieldsLookup: {
      direct: { type: "variable" },
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
        type: "indexed",
        value: "12",
        index: { type: "variable", value: "26" },
      },
      union: { type: "variable", value: "13" },
      value: {
        type: "add",
        valueA: { type: "variable", value: "14" },
        valueB: { type: "expression", value: "$15$ + 1" },
      },
      text: "%d$016$ #17# %t$18$ %f$19$",
      textarea: ["No variable", "$20$"],
      expression: "$21$[2] + $22$[$27$]",
      table: {
        variables: ["23"],
        rows: [{ values: [{ type: "number", value: 1 }] }],
      },
      references: [
        { type: "variable", id: "24" },
        { type: "sound", id: "sound1" },
      ],
      "$variable[V0]$": { type: "variable", value: "25" },
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

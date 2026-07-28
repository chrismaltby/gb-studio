import cloneDeep from "lodash/cloneDeep";
import { migrateFrom420r10To500r1Variables } from "lib/project/migration/versions/420to500";
import type { ScriptEventDefs } from "shared/lib/scripts/scriptDefHelpers";
import type { CompressedProjectResources } from "shared/lib/resources/types";
import {
  dummyCompressedProjectResources,
  dummyScriptResource,
} from "../../dummydata";

const scriptEventDefs = {
  EVENT_PLUGIN_VARIABLE: {
    fieldsLookup: {
      variable: { type: "variable" },
      unionVariable: { type: "union" },
      topLevelValue: { type: "value" },
      nestedValue: { type: "value" },
      nestedExpressionValue: { type: "value" },
      text: { type: "text" },
      textarea: { type: "textarea" },
      expression: { type: "matharea" },
      dataTable: { type: "dataTable" },
      references: { type: "references" },
      localVariable: { type: "variable" },
      outOfRangeVariable: { type: "variable" },
    },
  },
} as unknown as ScriptEventDefs;

test("creates entries for referenced unnamed legacy global variables", () => {
  const resources = {
    ...dummyCompressedProjectResources,
    scripts: [
      {
        ...dummyScriptResource,
        script: [
          {
            id: "event1",
            command: "EVENT_PLUGIN_VARIABLE",
            args: {
              variable: "1",
              unionVariable: { type: "variable", value: "2" },
              topLevelValue: { type: "variable", value: "4" },
              nestedValue: {
                type: "add",
                valueA: { type: "variable", value: "5" },
                valueB: { type: "number", value: 1 },
              },
              text: "%d$06$ #07# %t$08$ %f$09$",
              textarea: ["No variable", "$10$"],
              expression: "$11$ + $12$",
              dataTable: {
                variables: ["13"],
                rows: [{ values: [{ type: "number", value: 1 }] }],
              },
              references: [
                { type: "variable", id: "14" },
                { type: "sound", id: "sound1" },
              ],
              nestedExpressionValue: {
                type: "add",
                valueA: { type: "number", value: 1 },
                valueB: { type: "expression", value: "$16$ + $17$" },
              },
              localVariable: "L0",
              outOfRangeVariable: "512",
            },
          },
          {
            id: "event2",
            command: "EVENT_PLUGIN_VARIABLE",
            args: {
              "$variable[V0]$": { type: "variable", value: "15" },
            },
          },
        ],
      },
    ],
    variables: {
      ...dummyCompressedProjectResources.variables,
      variables: [
        {
          id: "3",
          name: "Named Variable",
          symbol: "var_1",
        },
      ],
    },
  };
  const originalResources = cloneDeep(resources);

  const migrated = migrateFrom420r10To500r1Variables(
    resources as unknown as CompressedProjectResources,
    {
      scriptEventDefs,
    },
  );

  const migratedVariables = migrated.variables.variables;
  expect(migratedVariables.map((variable) => variable.id)).toEqual([
    "3",
    "1",
    "2",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
  ]);
  expect(migratedVariables[0]).toEqual({
    id: "3",
    name: "Named Variable",
    symbol: "var_1",
    type: "number",
  });
  expect(migratedVariables.slice(1)).toEqual(
    migratedVariables.slice(1).map((variable) => ({
      id: variable.id,
      name: "",
      symbol: expect.any(String),
      type: "number",
    })),
  );
  expect(
    new Set(migratedVariables.map((variable) => variable.symbol)).size,
  ).toBe(migratedVariables.length);
  expect(resources).toEqual(originalResources);
});

test("adds number type to existing legacy variables", () => {
  const resources = {
    ...dummyCompressedProjectResources,
    variables: {
      ...dummyCompressedProjectResources.variables,
      variables: [
        {
          id: "legacy",
          name: "Legacy",
          symbol: "var_legacy",
        },
      ],
    },
  };

  const migrated = migrateFrom420r10To500r1Variables(
    resources as unknown as CompressedProjectResources,
    { scriptEventDefs },
  );

  expect(migrated.variables.variables).toEqual([
    {
      id: "legacy",
      name: "Legacy",
      symbol: "var_legacy",
      type: "number",
    },
  ]);
});

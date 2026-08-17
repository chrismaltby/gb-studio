import { getScriptEventFields } from "components/script/events/scriptEventFormFields";
import type { ScriptNormalized } from "shared/lib/entities/entitiesTypes";

test("Should use an unindexed array-only field for array reference arguments", () => {
  const customEvent = {
    id: "script1",
    name: "Script",
    description: "",
    variables: {
      V0: {
        id: "V0",
        name: "Array",
        passByReference: "array",
        size: 2,
      },
    },
    actors: {},
    symbol: "script_1",
    script: [],
  } satisfies ScriptNormalized;

  const fields = getScriptEventFields(
    "EVENT_CALL_CUSTOM_EVENT",
    { customEventId: customEvent.id },
    { [customEvent.id]: customEvent },
    {},
  );

  expect(fields).toContainEqual({
    label: "Array[2]",
    key: "$variable[V0]$",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
    variableType: "arrayReference",
    arraySize: 2,
  });
});

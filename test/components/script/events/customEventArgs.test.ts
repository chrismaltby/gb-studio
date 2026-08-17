import { applyCustomEventArgDefaults } from "components/script/events/customEventArgs";
import type { ScriptNormalized } from "shared/lib/entities/entitiesTypes";

const customEvent = {
  id: "script1",
  name: "Script",
  description: "",
  variables: {
    V0: {
      id: "V0",
      name: "Value",
      passByReference: true,
    },
    V1: {
      id: "V1",
      name: "Array",
      passByReference: "array",
      size: 2,
    },
  },
  actors: {
    "0": {
      id: "0",
      name: "Actor",
    },
  },
  symbol: "script_1",
  script: [],
} satisfies ScriptNormalized;

test("applies persisted defaults for custom event arguments", () => {
  expect(
    applyCustomEventArgDefaults(
      customEvent,
      { customEventId: customEvent.id },
      [
        { id: "scalar", type: "number" },
        { id: "array", type: "array", size: 2 },
      ],
      "scalar",
    ),
  ).toEqual({
    customEventId: customEvent.id,
    "$variable[V0]$": {
      type: "variable",
      value: "scalar",
    },
    "$variable[V1]$": {
      type: "variable",
      value: "array",
    },
    "$actor[0]$": "player",
  });
});

test("leaves an array reference unset when no array exists", () => {
  const args = applyCustomEventArgDefaults(
    customEvent,
    { customEventId: customEvent.id },
    [{ id: "scalar", type: "number" }],
    "scalar",
  );

  expect(args["$variable[V1]$"]).toBeUndefined();
});

test("selects only a sufficiently sized default array reference", () => {
  const args = applyCustomEventArgDefaults(
    customEvent,
    { customEventId: customEvent.id },
    [
      { id: "smallArray", type: "array", size: 1 },
      { id: "largeArray", type: "array", size: 3 },
    ],
  );

  expect(args["$variable[V1]$"]).toEqual({
    type: "variable",
    value: "largeArray",
  });
});

test("preserves existing custom event arguments", () => {
  expect(
    applyCustomEventArgDefaults(
      customEvent,
      {
        customEventId: customEvent.id,
        "$variable[V1]$": {
          type: "variable",
          value: "existingArray",
        },
      },
      [{ id: "array", type: "array" }],
    )["$variable[V1]$"],
  ).toEqual({
    type: "variable",
    value: "existingArray",
  });
});

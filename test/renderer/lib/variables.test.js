/**
 * @jest-environment jsdom
 */

import { namedCustomEventVariables } from "../../../src/renderer/lib/variables";

test("Should be able to extract named variables from custom event", () => {
  expect(
    namedCustomEventVariables(
      {
        variables: {
          V0: {
            name: "First",
            passByReference: "array",
          },
          V1: {
            name: "Second",
          },
        },
      },
      {},
    ).slice(0, 10),
  ).toEqual([
    {
      id: "V0",
      code: "V0",
      name: "First",
      displayName: "First[]",
      group: "SIDEBAR_PARAMETERS",
    },
    {
      id: "V1",
      code: "V1",
      name: "Second",
      displayName: "Second",
      group: "SIDEBAR_PARAMETERS",
    },
    {
      id: "V2",
      code: "V2",
      name: "Variable C",
      displayName: "Variable C",
      group: "SIDEBAR_PARAMETERS",
    },
    {
      id: "V3",
      code: "V3",
      name: "Variable D",
      displayName: "Variable D",
      group: "SIDEBAR_PARAMETERS",
    },
    {
      id: "V4",
      code: "V4",
      name: "Variable E",
      displayName: "Variable E",
      group: "SIDEBAR_PARAMETERS",
    },
    {
      id: "V5",
      code: "V5",
      name: "Variable F",
      displayName: "Variable F",
      group: "SIDEBAR_PARAMETERS",
    },
    {
      id: "V6",
      code: "V6",
      name: "Variable G",
      displayName: "Variable G",
      group: "SIDEBAR_PARAMETERS",
    },
    {
      id: "V7",
      code: "V7",
      name: "Variable H",
      displayName: "Variable H",
      group: "SIDEBAR_PARAMETERS",
    },
    {
      id: "V8",
      code: "V8",
      name: "Variable I",
      displayName: "Variable I",
      group: "SIDEBAR_PARAMETERS",
    },
    {
      id: "V9",
      code: "V9",
      name: "Variable J",
      displayName: "Variable J",
      group: "SIDEBAR_PARAMETERS",
    },
  ]);
});

test("Should keep array capacity separate from the variable name", () => {
  const variable = namedCustomEventVariables(
    {
      variables: {},
    },
    {
      array1: {
        id: "array1",
        name: "Inventory",
        symbol: "var_inventory",
        type: "array",
        size: 5,
      },
    },
  ).find(({ id }) => id === "array1");

  expect(variable).toMatchObject({
    name: "Inventory",
    displayName: "Inventory[5]",
  });
});

/**
 * @jest-environment jsdom
 */

import {
  nextVariable,
  prevVariable,
  namedCustomEventVariables,
} from "../../../src/renderer/lib/variables";

test("Should get next variable for global", () => {
  expect(nextVariable("0")).toBe("1");
  expect(nextVariable("512")).toBe("513");
});

test("Should get next variable for local", () => {
  expect(nextVariable("L0")).toBe("L1");
  expect(nextVariable("L3")).toBe("L4");
});

test("Should get next variable for temporary", () => {
  expect(nextVariable("T0")).toBe("T1");
});

test("Should use first global if no input provided", () => {
  expect(nextVariable()).toBe("1");
});

test("Should get prev variable for global", () => {
  expect(prevVariable("1")).toBe("0");
  expect(prevVariable("513")).toBe("512");
});

test("Should get prev variable for local", () => {
  expect(prevVariable("L1")).toBe("L0");
  expect(prevVariable("L4")).toBe("L3");
});

test("Should get prev variable for temporary", () => {
  expect(prevVariable("T1")).toBe("T0");
});

test("Should be able to extract named variables from custom event", () => {
  expect(
    namedCustomEventVariables(
      {
        variables: {
          V0: {
            name: "First",
          },
          V1: {
            name: "Second",
          },
        },
      },
      {}
    ).slice(0, 10)
  ).toEqual([
    {
      id: "V0",
      code: "V0",
      name: "First",
      group: "SIDEBAR_PARAMETERS",
    },
    {
      id: "V1",
      code: "V1",
      name: "Second",
      group: "SIDEBAR_PARAMETERS",
    },
    {
      id: "V2",
      code: "V2",
      name: "Variable C",
      group: "SIDEBAR_PARAMETERS",
    },
    {
      id: "V3",
      code: "V3",
      name: "Variable D",
      group: "SIDEBAR_PARAMETERS",
    },
    {
      id: "V4",
      code: "V4",
      name: "Variable E",
      group: "SIDEBAR_PARAMETERS",
    },
    {
      id: "V5",
      code: "V5",
      name: "Variable F",
      group: "SIDEBAR_PARAMETERS",
    },
    {
      id: "V6",
      code: "V6",
      name: "Variable G",
      group: "SIDEBAR_PARAMETERS",
    },
    {
      id: "V7",
      code: "V7",
      name: "Variable H",
      group: "SIDEBAR_PARAMETERS",
    },
    {
      id: "V8",
      code: "V8",
      name: "Variable I",
      group: "SIDEBAR_PARAMETERS",
    },
    {
      id: "V9",
      code: "V9",
      name: "Variable J",
      group: "SIDEBAR_PARAMETERS",
    },
  ]);
});

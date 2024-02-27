/* eslint-disable camelcase */
import {
  globalVariableCode,
  globalVariableName,
  tempVariableCode,
  tempVariableName,
  localVariableCode,
  localVariableName,
  customEventVariableCode,
  customEventVariableName,
} from "../../src/shared/lib/variables/variableNames";

test("Should get variable code for global", () => {
  expect(globalVariableCode("0")).toBe("00");
  expect(globalVariableCode("25")).toBe("25");
  expect(globalVariableCode("250")).toBe("250");
});

test("Should get variable name for global when provided", () => {
  expect(
    globalVariableName("50", {
      50: {
        id: "50",
        name: "My Variable Name",
      },
    })
  ).toBe("My Variable Name");
});

test("Should get default variable name for global when no custom name provided", () => {
  expect(
    globalVariableName("51", {
      50: {
        id: "50",
        name: "My Variable Name",
      },
    })
  ).toBe("Variable 51");
});

test("Should get variable code for temporary", () => {
  expect(tempVariableCode("0")).toBe("T0");
  expect(tempVariableCode("1")).toBe("T1");
});

test("Should get variable name for temporary", () => {
  expect(tempVariableName("0")).toBe("Temp 0");
  expect(tempVariableName("1")).toBe("Temp 1");
});

test("Should get variable code for local", () => {
  expect(localVariableCode("0")).toBe("L0");
  expect(localVariableCode("1")).toBe("L1");
  expect(localVariableCode("5")).toBe("L5");
});

test("Should get variable name for local when provided", () => {
  expect(
    localVariableName("5", "entity1", {
      entity1__L5: {
        id: "entity1__L5",
        name: "My Variable Name",
      },
    })
  ).toBe("My Variable Name");
});

test("Should get default variable name for local when no custom name provided", () => {
  expect(
    localVariableName("6", "entity1", {
      entity1__L5: {
        id: "entity1__L5",
        name: "My Variable Name",
      },
    })
  ).toBe("Local 6");
});

test("Should get variable code for custom event", () => {
  expect(customEventVariableCode("0")).toBe("V0");
  expect(customEventVariableCode("1")).toBe("V1");
  expect(customEventVariableCode("5")).toBe("V5");
});

test("Should get variable name for custom event when provided", () => {
  expect(
    customEventVariableName("5", {
      variables: {
        V5: {
          name: "My Variable Name",
        },
      },
    })
  ).toBe("My Variable Name");
});

test("Should get default variable name for custom event when no custom name provided", () => {
  expect(
    customEventVariableName("5", {
      variables: {
        V6: {
          name: "My Variable Name",
        },
      },
    })
  ).toBe("Variable F");
});

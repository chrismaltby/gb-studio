/* eslint-disable camelcase */
const {
  nextVariable,
  prevVariable,
  globalVariableCode,
  globalVariableName,
  tempVariableCode,
  tempVariableName,
  localVariableCode,
  localVariableName,
  customEventVariableCode,
  customEventVariableName,
  namedCustomEventVariables,
} = require("../../src/lib/helpers/variables");

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
        5: {
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
        6: {
          name: "My Variable Name",
        },
      },
    })
  ).toBe("Variable F");
});

test("Should be able to extract named variables from custom event", () => {
    expect(namedCustomEventVariables({
        variables: {
            0: {
                name: "First"
            },
            1: {
                name: "Second"
            }
        }
    })).toEqual([{
        id: "0",
        code: "V0",
        name: "First",
        group: ""
    },{
        id: "1",
        code: "V1",
        name: "Second",
        group: ""
    },{
        id: "2",
        code: "V2",
        name: "Variable C",
        group: ""
    },{
        id: "3",
        code: "V3",
        name: "Variable D",
        group: ""
    },{
        id: "4",
        code: "V4",
        name: "Variable E",
        group: ""
    },{
        id: "5",
        code: "V5",
        name: "Variable F",
        group: ""
    },{
        id: "6",
        code: "V6",
        name: "Variable G",
        group: ""
    },{
        id: "7",
        code: "V7",
        name: "Variable H",
        group: ""
    },{
        id: "8",
        code: "V8",
        name: "Variable I",
        group: ""
    },{
        id: "9",
        code: "V9",
        name: "Variable J",
        group: ""
    }])
})
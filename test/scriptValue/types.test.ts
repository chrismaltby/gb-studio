import {
  isInfix,
  isScriptValue,
  isValueAtomType,
  isValueNumber,
  isValueOperatorType,
} from "../../src/shared/lib/scriptValue/types";

test("should detect number as script value atom type", () => {
  expect(isValueAtomType("number")).toEqual(true);
});

test("should detect operation as not being a script value atom type", () => {
  expect(isValueAtomType("add")).toEqual(false);
});

test("should detect operation as script value operator type", () => {
  expect(isValueOperatorType("add")).toEqual(true);
});

test("should detect number as not being a script value operator type", () => {
  expect(isValueOperatorType("number")).toEqual(false);
});

test("should detect infix operation", () => {
  expect(isInfix("add")).toEqual(true);
});

test("should detect non-infix operation", () => {
  expect(isInfix("atan2")).toEqual(false);
});

test("should typeguard number as script value", () => {
  expect(
    isScriptValue({
      type: "number",
      value: 5,
    }),
  ).toEqual(true);
});

test("should cause invalid number to fail typeguard", () => {
  expect(
    isScriptValue({
      type: "number",
      value: "5",
    }),
  ).toEqual(false);
});

test("should typeguard true as script value", () => {
  expect(
    isScriptValue({
      type: "true",
    }),
  ).toEqual(true);
});

test("should typeguard false as script value", () => {
  expect(
    isScriptValue({
      type: "false",
    }),
  ).toEqual(true);
});

test("should typeguard property as script value", () => {
  expect(
    isScriptValue({
      type: "property",
      target: "player",
      property: "xpos",
    }),
  ).toEqual(true);
});

test("should cause property with invalid property to fail typeguard", () => {
  expect(
    isScriptValue({
      type: "property",
      target: "player",
      property: "health",
    }),
  ).toEqual(false);
});

test("should cause property with missing property to fail typeguard", () => {
  expect(
    isScriptValue({
      type: "property",
      target: "player",
    }),
  ).toEqual(false);
});

test("should cause property with missing target to fail typeguard", () => {
  expect(
    isScriptValue({
      type: "property",
      property: "xpos",
    }),
  ).toEqual(false);
});

test("should typeguard expression as script value", () => {
  expect(
    isScriptValue({
      type: "expression",
      value: "32 + 10",
    }),
  ).toEqual(true);
});

test("should cause expression with missing value to fail typeguard", () => {
  expect(
    isScriptValue({
      type: "expression",
    }),
  ).toEqual(false);
});

test("should typeguard valid operation as script value", () => {
  expect(
    isScriptValue({
      type: "add",
      valueA: {
        type: "number",
        value: 5,
      },
      valueB: {
        type: "number",
        value: 10,
      },
    }),
  ).toEqual(true);
});

test("should cause operation with invalid args to fail typeguard", () => {
  expect(
    isScriptValue({
      type: "add",
      valueA: {
        type: "number",
        value: "5",
      },
      valueB: {
        type: "madeup",
      },
    }),
  ).toEqual(false);
});

test("should typeguard operation with missing args as valid script value", () => {
  expect(
    isScriptValue({
      type: "add",
      valueA: undefined,
      valueB: undefined,
    }),
  ).toEqual(true);
});

test("should typeguard valid unary operation as script value", () => {
  expect(
    isScriptValue({
      type: "rnd",
      value: {
        type: "number",
        value: 5,
      },
    }),
  ).toEqual(true);
});

test("should cause unary operation with invalid arg to fail typeguard", () => {
  expect(
    isScriptValue({
      type: "rnd",
      value: {
        type: "madeup",
      },
    }),
  ).toEqual(false);
});

test("should typeguard unary operation with missing args as valid script value", () => {
  expect(
    isScriptValue({
      type: "rnd",
      value: undefined,
    }),
  ).toEqual(true);
});

test("should typeguard number as script value number atom", () => {
  expect(
    isValueNumber({
      type: "number",
      value: 5,
    }),
  ).toEqual(true);
});

test("should cause invalid number to fail script value number atom typeguard", () => {
  expect(
    isValueNumber({
      type: "number",
      value: "5",
    }),
  ).toEqual(false);
});

test("should typeguard engineField with key as valid script value", () => {
  expect(
    isScriptValue({
      type: "engineField",
      value: "plat_velocity_x",
    }),
  ).toEqual(true);
});

test("should typeguard engineField with empty key as valid script value", () => {
  expect(
    isScriptValue({
      type: "engineField",
      value: "",
    }),
  ).toEqual(true);
});

test("should typeguard engineField with missing key as valid script value", () => {
  expect(
    isScriptValue({
      type: "engineField",
    }),
  ).toEqual(false);
});

test("should typeguard variable as script value", () => {
  expect(
    isScriptValue({
      type: "variable",
      value: "L0",
    }),
  ).toEqual(true);
});

test("should typeguard variable with missing value as invalid script value", () => {
  expect(
    isScriptValue({
      type: "variable",
    }),
  ).toEqual(false);
});

test("should typeguard constant as script value", () => {
  expect(
    isScriptValue({
      type: "constant",
      value: "COLLISION_TOP",
    }),
  ).toEqual(true);
});

test("should typeguard constant with missing value as invalid script value", () => {
  expect(
    isScriptValue({
      type: "constant",
    }),
  ).toEqual(false);
});

test("should typeguard nested operations as script value", () => {
  expect(
    isScriptValue({
      type: "add",
      valueA: {
        type: "mul",
        valueA: {
          type: "number",
          value: 2,
        },
        valueB: {
          type: "number",
          value: 3,
        },
      },
      valueB: {
        type: "variable",
        value: "L0",
      },
    }),
  ).toEqual(true);
});

test("should cause deeply nested operations with invalid values to fail typeguard", () => {
  expect(
    isScriptValue({
      type: "add",
      valueA: {
        type: "mul",
        valueA: {
          type: "number",
          value: "invalid",
        },
        valueB: {
          type: "number",
          value: 3,
        },
      },
      valueB: {
        type: "variable",
        value: "L0",
      },
    }),
  ).toEqual(false);
});

test("should cause completely invalid object to fail typeguard", () => {
  expect(
    isScriptValue({
      invalidProperty: "test",
    }),
  ).toEqual(false);
});

test("should cause null to fail typeguard", () => {
  expect(isScriptValue(null)).toEqual(false);
});

test("should cause undefined to fail typeguard", () => {
  expect(isScriptValue(undefined)).toEqual(false);
});

test("should cause string to fail typeguard", () => {
  expect(isScriptValue("test")).toEqual(false);
});

test("should cause number to fail typeguard", () => {
  expect(isScriptValue(42)).toEqual(false);
});

test("should cause array to fail typeguard", () => {
  expect(isScriptValue([])).toEqual(false);
});

test("should typeguard object with unknown operation type as invalid", () => {
  expect(
    isScriptValue({
      type: "unknownOperation",
      value: 5,
    }),
  ).toEqual(false);
});

test("should typeguard complex unary operation chain as script value", () => {
  expect(
    isScriptValue({
      type: "abs",
      value: {
        type: "rnd",
        value: {
          type: "add",
          valueA: {
            type: "number",
            value: 10,
          },
          valueB: {
            type: "number",
            value: 5,
          },
        },
      },
    }),
  ).toEqual(true);
});

test("should typeguard ternary operations as script value", () => {
  expect(
    isScriptValue({
      type: "gte",
      valueA: {
        type: "variable",
        value: "L0",
      },
      valueB: {
        type: "number",
        value: 10,
      },
    }),
  ).toEqual(true);
});

test("should typeguard property with actor target as script value", () => {
  expect(
    isScriptValue({
      type: "property",
      target: "$self$",
      property: "xpos",
    }),
  ).toEqual(true);
});

test("should typeguard all mathematical operations", () => {
  const mathOps = ["add", "sub", "mul", "div", "mod"];
  mathOps.forEach((op) => {
    expect(
      isScriptValue({
        type: op,
        valueA: {
          type: "number",
          value: 5,
        },
        valueB: {
          type: "number",
          value: 3,
        },
      }),
    ).toEqual(true);
  });
});

test("should typeguard all comparison operations", () => {
  const compOps = ["eq", "ne", "lt", "lte", "gt", "gte"];
  compOps.forEach((op) => {
    expect(
      isScriptValue({
        type: op,
        valueA: {
          type: "number",
          value: 5,
        },
        valueB: {
          type: "number",
          value: 3,
        },
      }),
    ).toEqual(true);
  });
});

test("should typeguard all logical operations", () => {
  const logicOps = ["and", "or"];
  logicOps.forEach((op) => {
    expect(
      isScriptValue({
        type: op,
        valueA: {
          type: "true",
        },
        valueB: {
          type: "false",
        },
      }),
    ).toEqual(true);
  });
});

test("should typeguard all unary operations", () => {
  const unaryOps = ["not", "abs", "atan2", "rnd"];
  unaryOps.forEach((op) => {
    expect(
      isScriptValue({
        type: op,
        value: {
          type: "number",
          value: 5,
        },
      }),
    ).toEqual(true);
  });
});

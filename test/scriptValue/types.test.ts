import {
  ScriptValue,
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
    })
  ).toEqual(true);
});

test("should cause invalid number to fail typeguard", () => {
  expect(
    isScriptValue({
      type: "number",
      value: "5",
    })
  ).toEqual(false);
});

test("should typeguard true as script value", () => {
  expect(
    isScriptValue({
      type: "true",
    })
  ).toEqual(true);
});

test("should typeguard false as script value", () => {
  expect(
    isScriptValue({
      type: "false",
    })
  ).toEqual(true);
});

test("should typeguard property as script value", () => {
  expect(
    isScriptValue({
      type: "property",
      target: "player",
      property: "xpos",
    })
  ).toEqual(true);
});

test("should cause property with invalid property to fail typeguard", () => {
  expect(
    isScriptValue({
      type: "property",
      target: "player",
      property: "health",
    })
  ).toEqual(false);
});

test("should cause property with missing property to fail typeguard", () => {
  expect(
    isScriptValue({
      type: "property",
      target: "player",
    })
  ).toEqual(false);
});

test("should cause property with missing target to fail typeguard", () => {
  expect(
    isScriptValue({
      type: "property",
      property: "xpos",
    })
  ).toEqual(false);
});

test("should typeguard expression as script value", () => {
  expect(
    isScriptValue({
      type: "expression",
      value: "32 + 10",
    })
  ).toEqual(true);
});

test("should cause expression with missing value to fail typeguard", () => {
  expect(
    isScriptValue({
      type: "expression",
    })
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
    })
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
    })
  ).toEqual(false);
});

test("should typeguard operation with missing args as valid script value", () => {
  expect(
    isScriptValue({
      type: "add",
      valueA: undefined,
      valueB: undefined,
    })
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
    })
  ).toEqual(true);
});

test("should cause unary operation with invalid arg to fail typeguard", () => {
  expect(
    isScriptValue({
      type: "rnd",
      value: {
        type: "madeup",
      },
    })
  ).toEqual(false);
});

test("should typeguard unary operation with missing args as valid script value", () => {
  expect(
    isScriptValue({
      type: "rnd",
      value: undefined,
    })
  ).toEqual(true);
});

test("should typeguard number as script value number atom", () => {
  expect(
    isValueNumber({
      type: "number",
      value: 5,
    })
  ).toEqual(true);
});

test("should cause invalid number to fail script value number atom typeguard", () => {
  expect(
    isValueNumber({
      type: "number",
      value: "5",
    })
  ).toEqual(false);
});

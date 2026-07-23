import {
  expressionToScriptValue,
  optimiseScriptValue,
  extractScriptValueVariables,
  precompileScriptValue,
} from "shared/lib/scriptValue/helpers";
import { ScriptValue } from "shared/lib/scriptValue/types";

describe("expressionToScriptValue array support", () => {
  test("should convert array access with constant index", () => {
    expect(expressionToScriptValue("Coins[2]")).toEqual({
      type: "arrayValue",
      name: "Coins",
      index: { type: "number", value: 2 },
    });
  });

  test("should convert array access with variable index", () => {
    expect(expressionToScriptValue("Coins[$05$]")).toEqual({
      type: "arrayValue",
      name: "Coins",
      index: { type: "variable", value: "5" },
    });
  });

  test("should convert array access within larger expression", () => {
    expect(expressionToScriptValue("Coins[0] + 1")).toEqual({
      type: "add",
      valueA: {
        type: "arrayValue",
        name: "Coins",
        index: { type: "number", value: 0 },
      },
      valueB: { type: "number", value: 1 },
    });
  });

  test("should convert nested array accesses", () => {
    expect(expressionToScriptValue("Outer[Inner[1]]")).toEqual({
      type: "arrayValue",
      name: "Outer",
      index: {
        type: "arrayValue",
        name: "Inner",
        index: { type: "number", value: 1 },
      },
    });
  });

  test("should return zero for assignment expressions in value context", () => {
    expect(expressionToScriptValue("$00$ = 5")).toEqual({
      type: "number",
      value: 0,
    });
    expect(expressionToScriptValue("Coins[0] = 5")).toEqual({
      type: "number",
      value: 0,
    });
  });
});

describe("optimiseScriptValue array support", () => {
  test("should constant fold within array index", () => {
    const input: ScriptValue = {
      type: "expression",
      value: "Coins[1 + 1]",
    };
    expect(optimiseScriptValue(input)).toEqual({
      type: "arrayValue",
      name: "Coins",
      index: { type: "number", value: 2 },
    });
  });
});

describe("extractScriptValueVariables array support", () => {
  test("should extract variables used in array indexes", () => {
    const input: ScriptValue = {
      type: "expression",
      value: "Coins[$07$] + $08$",
    };
    const variables = extractScriptValueVariables(input);
    expect(variables).toContain("7");
    expect(variables).toContain("8");
  });
});

describe("precompileScriptValue array support", () => {
  test("should produce arrayIndex fetch op and indirectLocal rpn op", () => {
    const input: ScriptValue = {
      type: "expression",
      value: "Coins[$05$] + 1",
    };
    const [rpnOps, fetchOps] = precompileScriptValue(input);
    expect(fetchOps).toEqual([
      {
        local: "local_0",
        value: {
          type: "arrayIndex",
          name: "Coins",
          index: { type: "variable", value: "5" },
        },
      },
    ]);
    expect(rpnOps).toEqual([
      { type: "indirectLocal", value: "local_0" },
      { type: "number", value: 1 },
      { type: "add" },
    ]);
  });
});

import ScriptBuilder from "../../src/lib/compiler/scriptBuilder/scriptBuilder";
import { ScriptBuilderOptions } from "../../src/lib/compiler/scriptBuilder/types";
import { VariableMapData } from "../../src/lib/compiler/compileData";

const makeVariableMapData = (
  id: string,
  name: string,
  symbol: string,
  index: number,
): VariableMapData => ({
  id,
  name,
  symbol,
  isLocal: false,
  entityType: "scene",
  entityId: "",
  sceneId: "",
  index,
});

const createArrayTestScriptBuilder = () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {
    variablesLookup: {
      "2": { id: "2", name: "Result", symbol: "var_result" },
      "3": { id: "3", name: "Idx", symbol: "var_idx" },
      "5": { id: "5", name: "Coins/Coins 0", symbol: "var_coins_0" },
      "6": { id: "6", name: "Coins/Coins 1", symbol: "var_coins_1" },
      "7": { id: "7", name: "Coins/Coins 2", symbol: "var_coins_2" },
    },
    variableAliasLookup: {
      "2": makeVariableMapData("2", "Result", "VAR_RESULT", 0),
      "3": makeVariableMapData("3", "Idx", "VAR_IDX", 1),
      "5": makeVariableMapData("5", "Coins/Coins 0", "VAR_COINS_0", 2),
      "6": makeVariableMapData("6", "Coins/Coins 1", "VAR_COINS_1", 3),
      "7": makeVariableMapData("7", "Coins/Coins 2", "VAR_COINS_2", 4),
    },
  } as unknown as ScriptBuilderOptions);
  return { sb, output };
};

test("Should read an array item with a constant index", () => {
  const { sb, output } = createArrayTestScriptBuilder();
  sb.variableEvaluateExpression("2", "Coins[1]");
  const text = output.join("\n");
  // Index precalculated from the folder's base symbol
  expect(text).toMatch(/\.R_INT16\s+VAR_COINS_0/);
  expect(text).toMatch(/\.R_INT16\s+1/);
  expect(text).toMatch(/\.R_OPERATOR\s+\.ADD/);
  expect(text).toMatch(/\.R_REF_SET\s+\.LOCAL_ARR_IDX_0/);
  // Value read through indirection into the result variable
  expect(text).toMatch(/\.R_REF_IND\s+\.LOCAL_ARR_IDX_0/);
  expect(text).toMatch(/\.R_REF_SET\s+VAR_RESULT/);
  sb._assertStackNeutral(0);
});

test("Should read an array item with a variable index", () => {
  const { sb, output } = createArrayTestScriptBuilder();
  sb.variableEvaluateExpression("2", "Coins[$03$] + 1");
  const text = output.join("\n");
  expect(text).toMatch(/\.R_INT16\s+VAR_COINS_0/);
  expect(text).toMatch(/\.R_REF\s+VAR_IDX/);
  expect(text).toMatch(/\.R_REF_IND\s+\.LOCAL_ARR_IDX_0/);
  expect(text).toMatch(/\.R_REF_SET\s+VAR_RESULT/);
  sb._assertStackNeutral(0);
});

test("Should assign an array item with a constant index", () => {
  const { sb, output } = createArrayTestScriptBuilder();
  sb.variableEvaluateExpression("2", "Coins[0] = 5");
  const text = output.join("\n");
  // Target index precalculated
  expect(text).toMatch(/\.R_INT16\s+VAR_COINS_0/);
  expect(text).toMatch(/\.R_REF_SET\s+\.LOCAL_ARR_IDX_0/);
  // Value stored through indirection
  expect(text).toMatch(/VM_SET_INDIRECT/);
  // Result variable receives the assigned value
  expect(text).toMatch(/VM_SET\s+VAR_RESULT, \.ARG0/);
  expect(text).toMatch(/VM_POP\s+1/);
  sb._assertStackNeutral(0);
});

test("Should assign an array item with a variable index", () => {
  const { sb, output } = createArrayTestScriptBuilder();
  sb.variableEvaluateExpression("2", "Coins[$03$] = Coins[0] + 1");
  const text = output.join("\n");
  // Two array index locals — one for the read, one for the write target
  expect(text).toMatch(/\.R_REF_SET\s+\.LOCAL_ARR_IDX_0/);
  expect(text).toMatch(/\.R_REF_SET\s+\.LOCAL_ARR_IDX_1/);
  expect(text).toMatch(/\.R_REF_IND\s+\.LOCAL_ARR_IDX_0/);
  expect(text).toMatch(/VM_SET_INDIRECT/);
  sb._assertStackNeutral(0);
});

test("Should assign to a variable within the expression", () => {
  const { sb, output } = createArrayTestScriptBuilder();
  sb.variableEvaluateExpression("2", "$03$ = Coins[2]");
  const text = output.join("\n");
  expect(text).toMatch(/\.R_REF_IND\s+\.LOCAL_ARR_IDX_0/);
  expect(text).toMatch(/\.R_REF_SET\s+VAR_IDX/);
  // Result variable receives the assigned value too
  expect(text).toMatch(/VM_SET\s+VAR_RESULT, VAR_IDX/);
  sb._assertStackNeutral(0);
});

test("Should support nested array accesses", () => {
  const { sb, output } = createArrayTestScriptBuilder();
  sb.variableEvaluateExpression("2", "Coins[Coins[0]]");
  const text = output.join("\n");
  // Inner access resolved first, outer access uses its value
  expect(text).toMatch(/\.R_REF_IND\s+\.LOCAL_ARR_IDX_0/);
  expect(text).toMatch(/\.R_REF_IND\s+\.LOCAL_ARR_IDX_1/);
  sb._assertStackNeutral(0);
});

test("Should throw for unknown array names", () => {
  const { sb } = createArrayTestScriptBuilder();
  expect(() => sb.variableEvaluateExpression("2", "Unknown[0]")).toThrow(
    /Unknown variable array "Unknown"/,
  );
});

test("Should compile array access in script value expressions", () => {
  const { sb, output } = createArrayTestScriptBuilder();
  sb._stackPushScriptValue({
    type: "expression",
    value: "Coins[$03$] + 1",
  });
  const text = output.join("\n");
  // Fetch op computes the array index into a local
  expect(text).toMatch(/-- Calculate Coins\[\] index/);
  expect(text).toMatch(/\.R_INT16\s+VAR_COINS_0/);
  expect(text).toMatch(/\.R_REF\s+VAR_IDX/);
  expect(text).toMatch(/\.R_REF_SET\s+\.LOCAL_TMP0_ARR_IDX/);
  // Value read through indirection in the main RPN
  expect(text).toMatch(/\.R_REF_IND\s+\.LOCAL_TMP0_ARR_IDX/);
  sb._assertStackNeutral(1);
});

test("Should compile a direct arrayValue script value node", () => {
  const { sb, output } = createArrayTestScriptBuilder();
  sb._stackPushScriptValue({
    type: "arrayValue",
    name: "Coins",
    index: { type: "variable", value: "3" },
  });
  const text = output.join("\n");
  expect(text).toMatch(/\.R_INT16\s+VAR_COINS_0/);
  expect(text).toMatch(/\.R_REF\s+VAR_IDX/);
  expect(text).toMatch(/\.R_REF_IND\s+\.LOCAL_TMP0_ARR_IDX/);
  sb._assertStackNeutral(1);
});

test("Should compile nested array accesses in script values", () => {
  const { sb, output } = createArrayTestScriptBuilder();
  sb._stackPushScriptValue({
    type: "expression",
    value: "Coins[Coins[0]]",
  });
  const text = output.join("\n");
  // Two index locals — inner access fetched while computing outer index
  expect(text).toMatch(/\.R_REF_SET\s+\.LOCAL_TMP0_ARR_IDX/);
  expect(text).toMatch(/\.R_REF_SET\s+\.LOCAL_TMP1_ARR_IDX/);
  expect(text).toMatch(/\.R_REF_IND\s+\.LOCAL_TMP0_ARR_IDX/);
  expect(text).toMatch(/\.R_REF_IND\s+\.LOCAL_TMP1_ARR_IDX/);
  sb._assertStackNeutral(1);
});

test("Should fallback to 0 with warning for arrayValue with no array selected", () => {
  const output: string[] = [];
  const warnings: string[] = [];
  const sb = new ScriptBuilder(output, {
    variablesLookup: {},
    variableAliasLookup: {},
    warnings: (msg: string) => warnings.push(msg),
  } as unknown as ScriptBuilderOptions);
  sb._stackPushScriptValue({
    type: "arrayValue",
    name: "",
    index: { type: "number", value: 0 },
  });
  const text = output.join("\n");
  expect(warnings).toHaveLength(1);
  expect(text).toMatch(/\.R_INT16\s+0/);
  expect(text).not.toMatch(/\.R_REF_IND/);
  sb._assertStackNeutral(1);
});

test("Should throw for unknown array names in script values", () => {
  const { sb } = createArrayTestScriptBuilder();
  expect(() =>
    sb._stackPushScriptValue({
      type: "arrayValue",
      name: "Unknown",
      index: { type: "number", value: 0 },
    }),
  ).toThrow(/Unknown variable array "Unknown"/);
});

test("Should set array value via variableArraySetValue with constant index", () => {
  const { sb, output } = createArrayTestScriptBuilder();
  sb.variableArraySetValue(
    "Coins",
    { type: "number", value: 1 },
    { type: "number", value: 5 },
  );
  const text = output.join("\n");
  // Base symbol + index precalculated into a local
  expect(text).toMatch(/\.R_INT16\s+VAR_COINS_0/);
  expect(text).toMatch(/\.R_INT16\s+1/);
  expect(text).toMatch(/\.R_REF_SET\s+\.LOCAL_TMP0_ARR_IDX/);
  // Value pushed then stored through indirection
  expect(text).toMatch(/VM_PUSH_CONST\s+5/);
  expect(text).toMatch(/VM_SET_INDIRECT/);
  expect(text).toMatch(/VM_POP\s+1/);
  sb._assertStackNeutral(0);
});

test("Should set array value via variableArraySetValue with variable index and value", () => {
  const { sb, output } = createArrayTestScriptBuilder();
  sb.variableArraySetValue(
    "Coins",
    { type: "variable", value: "3" },
    { type: "variable", value: "2" },
  );
  const text = output.join("\n");
  expect(text).toMatch(/\.R_REF\s+VAR_IDX/);
  expect(text).toMatch(/\.R_REF_SET\s+\.LOCAL_TMP0_ARR_IDX/);
  expect(text).toMatch(/VM_PUSH_VALUE\s+VAR_RESULT/);
  expect(text).toMatch(/VM_SET_INDIRECT/);
  sb._assertStackNeutral(0);
});

test("Should get array value via variableArrayGetValue with variable index", () => {
  const { sb, output } = createArrayTestScriptBuilder();
  sb.variableArrayGetValue("2", "Coins", { type: "variable", value: "3" });
  const text = output.join("\n");
  // Index precalculated then read through indirection into the variable
  expect(text).toMatch(/\.R_INT16\s+VAR_COINS_0/);
  expect(text).toMatch(/\.R_REF\s+VAR_IDX/);
  expect(text).toMatch(/\.R_REF_SET\s+\.LOCAL_TMP0_ARR_IDX/);
  expect(text).toMatch(/\.R_REF_IND\s+\.LOCAL_TMP0_ARR_IDX/);
  expect(text).toMatch(/\.R_REF_SET\s+VAR_RESULT/);
  sb._assertStackNeutral(0);
});

test("Should get array value with constant index", () => {
  const { sb, output } = createArrayTestScriptBuilder();
  sb.variableArrayGetValue("2", "Coins", { type: "number", value: 2 });
  const text = output.join("\n");
  expect(text).toMatch(/\.R_INT16\s+VAR_COINS_0/);
  expect(text).toMatch(/\.R_INT16\s+2/);
  expect(text).toMatch(/\.R_REF_IND\s+\.LOCAL_TMP0_ARR_IDX/);
  expect(text).toMatch(/\.R_REF_SET\s+VAR_RESULT/);
  sb._assertStackNeutral(0);
});

test("Should warn and skip variableArrayGetValue when no array selected", () => {
  const output: string[] = [];
  const warnings: string[] = [];
  const sb = new ScriptBuilder(output, {
    variablesLookup: {},
    variableAliasLookup: {},
    warnings: (msg: string) => warnings.push(msg),
  } as unknown as ScriptBuilderOptions);
  sb.variableArrayGetValue("2", "", { type: "number", value: 0 });
  expect(output).toEqual([]);
  expect(warnings).toHaveLength(1);
});

test("Should warn and skip variableArraySetValue when no array selected", () => {
  const output: string[] = [];
  const warnings: string[] = [];
  const sb = new ScriptBuilder(output, {
    variablesLookup: {},
    variableAliasLookup: {},
    warnings: (msg: string) => warnings.push(msg),
  } as unknown as ScriptBuilderOptions);
  sb.variableArraySetValue(
    "",
    { type: "number", value: 0 },
    { type: "number", value: 5 },
  );
  expect(output).toEqual([]);
  expect(warnings).toHaveLength(1);
});

test("Should still compile plain expressions", () => {
  const { sb, output } = createArrayTestScriptBuilder();
  sb.variableEvaluateExpression("2", "$03$ + 1");
  const text = output.join("\n");
  expect(text).toMatch(/\.R_REF\s+VAR_IDX/);
  expect(text).toMatch(/\.R_INT16\s+1/);
  expect(text).toMatch(/\.R_REF_SET\s+VAR_RESULT/);
  sb._assertStackNeutral(0);
});

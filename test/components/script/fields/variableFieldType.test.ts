import {
  allowedVariableTypesForFieldType,
  variableTypeAllowsIndex,
  variableValueForType,
} from "components/script/fields/variableFieldType";

const index = { type: "number" as const, value: 2 };

describe("variable field types", () => {
  test("any accepts all variables and indexes arrays", () => {
    expect(allowedVariableTypesForFieldType("any")).toBeUndefined();
    expect(variableTypeAllowsIndex("any")).toBe(true);
    expect(variableValueForType("any", "scalar", index, false)).toBe("scalar");
    expect(variableValueForType("any", "array", index, true)).toEqual({
      type: "variable",
      value: "array",
      index,
    });
  });

  test("arrayElement only accepts arrays and stores an indexed element", () => {
    expect(allowedVariableTypesForFieldType("arrayElement")).toEqual(["array"]);
    expect(variableTypeAllowsIndex("arrayElement")).toBe(true);
    expect(variableValueForType("arrayElement", "array", index, false)).toEqual(
      {
        type: "variable",
        value: "array",
        index,
      },
    );
  });

  test("arrayReference only accepts arrays and stores the unindexed root", () => {
    expect(allowedVariableTypesForFieldType("arrayReference")).toEqual([
      "array",
    ]);
    expect(variableTypeAllowsIndex("arrayReference")).toBe(false);
    expect(
      variableValueForType("arrayReference", "array", index, true),
    ).toEqual({
      type: "variable",
      value: "array",
    });
  });
});

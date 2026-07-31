import {
  allowedVariableTypesForFieldType,
  defaultVariableValueForType,
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

  test("defaults to the first compatible variable", () => {
    const candidates = [
      { id: "scalar", type: "number" as const },
      { id: "array", type: "array" as const },
    ];

    expect(defaultVariableValueForType("arrayReference", candidates)).toEqual({
      type: "variable",
      value: "array",
    });
    expect(defaultVariableValueForType("arrayElement", candidates)).toEqual({
      type: "variable",
      value: "array",
      index: { type: "number", value: 0 },
    });
  });

  test("does not invent a default when no compatible variable exists", () => {
    expect(
      defaultVariableValueForType("arrayReference", [
        { id: "scalar", type: "number" },
      ]),
    ).toBeUndefined();
  });
});

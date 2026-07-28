import { expandDebuggerVariables } from "shared/lib/debugger/variables";
import type { VariableMapData } from "lib/compiler/compileData";

test("expands array variables into rows using compiled memory offsets", () => {
  const variables: Record<string, VariableMapData> = {
    VAR_ARRAY: {
      id: "array",
      name: "Array",
      symbol: "VAR_ARRAY",
      isLocal: false,
      entityType: "scene",
      entityId: "",
      sceneId: "",
      size: 3,
      offset: 0,
    },
    VAR_NUMBER: {
      id: "number",
      name: "Number",
      symbol: "VAR_NUMBER",
      isLocal: false,
      entityType: "scene",
      entityId: "",
      sceneId: "",
      size: 1,
      offset: 3,
    },
  };

  expect(
    expandDebuggerVariables(
      ["VAR_ARRAY", "VAR_NUMBER"],
      variables,
      [10, 20, 30, 40],
    ).map(({ displayName, displaySymbol, arrayIndex, value }) => ({
      displayName,
      displaySymbol,
      arrayIndex,
      value,
    })),
  ).toEqual([
    {
      displayName: "Array[0]",
      displaySymbol: "VAR_ARRAY[0]",
      arrayIndex: 0,
      value: 10,
    },
    {
      displayName: "Array[1]",
      displaySymbol: "VAR_ARRAY[1]",
      arrayIndex: 1,
      value: 20,
    },
    {
      displayName: "Array[2]",
      displaySymbol: "VAR_ARRAY[2]",
      arrayIndex: 2,
      value: 30,
    },
    {
      displayName: "Number",
      displaySymbol: "VAR_NUMBER",
      arrayIndex: 0,
      value: 40,
    },
  ]);
});

test("falls back to contiguous offsets for older debugger maps", () => {
  const variables: Record<string, VariableMapData> = {
    VAR_ARRAY: {
      id: "array",
      name: "Array",
      symbol: "VAR_ARRAY",
      isLocal: false,
      entityType: "scene",
      entityId: "",
      sceneId: "",
      size: 2,
    },
    VAR_NUMBER: {
      id: "number",
      name: "Number",
      symbol: "VAR_NUMBER",
      isLocal: false,
      entityType: "scene",
      entityId: "",
      sceneId: "",
    },
  };

  expect(
    expandDebuggerVariables(
      ["VAR_ARRAY", "VAR_NUMBER"],
      variables,
      [1, 2, 3],
    ).map(({ value }) => value),
  ).toEqual([1, 2, 3]);
});

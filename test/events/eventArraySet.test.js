import { compile } from "../../src/lib/events/eventArraySet";

test("Should use an array reference and compile variable set to value for each item", () => {
  const mockVariableSetToScriptValue = jest.fn();
  const array = { type: "variable", value: "array", size: 3 };
  const arrayValues = [
    { value: { type: "number", value: 10 } },
    { value: { type: "number", value: 11 } },
    { value: { type: "number", value: 12 } },
  ];

  compile(
    {
      array,
      arrayValues,
    },
    {
      variableSetToScriptValue: mockVariableSetToScriptValue,
      _getArrayLength: () => array.size,
    },
  );

  expect(mockVariableSetToScriptValue).toHaveBeenCalledTimes(3);

  expect(mockVariableSetToScriptValue).toHaveBeenNthCalledWith(
    1,
    {
      type: "variable",
      value: "array",
      size: 3,
      index: { type: "number", value: 0 },
    },
    { value: { type: "number", value: 10 } },
  );

  expect(mockVariableSetToScriptValue).toHaveBeenNthCalledWith(
    2,
    {
      type: "variable",
      value: "array",
      size: 3,
      index: { type: "number", value: 1 },
    },
    { value: { type: "number", value: 11 } },
  );

  expect(mockVariableSetToScriptValue).toHaveBeenNthCalledWith(
    3,
    {
      type: "variable",
      value: "array",
      size: 3,
      index: { type: "number", value: 2 },
    },
    { value: { type: "number", value: 12 } },
  );
});

test("Should throw a compile error if the array values lenght is bigger than the array length", () => {
  const mockVariableSetToScriptValue = jest.fn();
  const array = { type: "variable", value: "array", size: 3 };
  const arrayValues = [
    { value: { type: "number", value: 10 } },
    { value: { type: "number", value: 11 } },
    { value: { type: "number", value: 12 } },
    { value: { type: "number", value: 13 } },
    { value: { type: "number", value: 14 } },
    { value: { type: "number", value: 15 } },
  ];

  expect(() =>
    compile(
      {
        array,
        arrayValues,
      },
      {
        variableSetToScriptValue: mockVariableSetToScriptValue,
        _getArrayLength: () => array.size,
      },
    ),
  ).toThrow(
    "Trying to initialize an array with 6 elements, but the provided array has 3",
  );
});

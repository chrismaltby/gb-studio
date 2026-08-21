import { compile } from "../../src/lib/events/eventArraySet";

test("Should use an array reference and compile variable set to value for each item", () => {
  const mockArraySetToScriptValues = jest.fn();
  const array = { type: "variable", value: "array", size: 3 };
  const values = [
    { value: { type: "number", value: 10 } },
    { value: { type: "number", value: 11 } },
    { value: { type: "number", value: 12 } },
  ];

  compile(
    {
      array,
      values,
    },
    {
      arraySetToScriptValues: mockArraySetToScriptValues,
      _getArrayLength: () => array.size,
    },
  );

  expect(mockArraySetToScriptValues).toHaveBeenCalledTimes(1);
  expect(mockArraySetToScriptValues).toHaveBeenCalledWith(array, values);
});

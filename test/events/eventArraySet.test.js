import { compile } from "../../src/lib/events/eventArraySet";

test("Should use an array reference and compile variable set to value for each item", () => {
  const mockArraySetToScriptValues = jest.fn();
  const array = { type: "variable", value: "array", size: 3 };
  const values = [
    { type: "number", value: 10 },
    { type: "number", value: 11 },
    { type: "number", value: 12 },
  ];

  compile(
    {
      array,
      values,
    },
    {
      arraySetToScriptValues: mockArraySetToScriptValues,
    },
  );

  expect(mockArraySetToScriptValues).toHaveBeenCalledTimes(1);
  expect(mockArraySetToScriptValues).toHaveBeenCalledWith(array, values);
});

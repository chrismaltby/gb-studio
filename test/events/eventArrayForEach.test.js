import { compile, fields } from "../../src/lib/events/eventArrayForEach";

test("Should use an array reference and compile the loop body", () => {
  const mockArrayForEach = jest.fn();
  const array = { type: "variable", value: "array" };
  const truePath = [{ command: "EVENT_END", id: "abc" }];

  compile(
    {
      variable: "currentValue",
      array,
      true: truePath,
    },
    { arrayForEach: mockArrayForEach },
  );

  expect(mockArrayForEach).toHaveBeenCalledWith(
    "currentValue",
    array,
    truePath,
  );
  expect(fields).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ key: "variable", type: "variable" }),
      expect.objectContaining({
        key: "array",
        type: "variable",
        variableType: "arrayReference",
      }),
      expect.objectContaining({ key: "true", type: "events" }),
    ]),
  );
});

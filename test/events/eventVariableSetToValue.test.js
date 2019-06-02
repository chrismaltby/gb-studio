import { compile } from "../../src/lib/events/eventVariableSetToValue";

test("Should set variable to a value", () => {
  const mockVariableSetToValue = jest.fn();
  compile(
    {
      variable: "2",
      value: 9
    },
    {
      variableSetToValue: mockVariableSetToValue
    }
  );
  expect(mockVariableSetToValue).toBeCalledWith("2", 9);
});

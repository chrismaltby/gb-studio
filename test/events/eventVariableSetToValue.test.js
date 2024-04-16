import { compile } from "../../src/lib/events/eventVariableSetToValue";

test("Should set variable to a value", () => {
  const mockVariableSetToValue = jest.fn();
  compile(
    {
      variable: "2",
      value: {
        type: "number",
        value: 9,
      },
    },
    {
      variableSetToScriptValue: mockVariableSetToValue,
    }
  );
  expect(mockVariableSetToValue).toBeCalledWith("2", {
    type: "number",
    value: 9,
  });
});

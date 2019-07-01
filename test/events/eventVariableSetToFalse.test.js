import { compile } from "../../src/lib/events/eventVariableSetToFalse";

test("Should set variable to true", () => {
  const mockVariableSetToFalse = jest.fn();

  compile(
    {
      variable: "5"
    },
    {
      variableSetToFalse: mockVariableSetToFalse
    }
  );
  expect(mockVariableSetToFalse).toBeCalledWith("5");
});

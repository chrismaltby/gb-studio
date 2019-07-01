import { compile } from "../../src/lib/events/eventVariableSetToTrue";

test("Should set variable to true", () => {
  const mockVariableSetToTrue = jest.fn();
  compile(
    {
      variable: "2"
    },
    {
      variableSetToTrue: mockVariableSetToTrue
    }
  );
  expect(mockVariableSetToTrue).toBeCalledWith("2");
});

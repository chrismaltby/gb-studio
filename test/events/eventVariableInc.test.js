import { compile } from "../../src/lib/events/eventVariableInc";

test("Should be able to increment value", () => {
  const mockVariableInc = jest.fn();
  compile(
    {
      variable: "2"
    },
    {
      variableInc: mockVariableInc
    }
  );
  expect(mockVariableInc).toBeCalledWith("2");
});

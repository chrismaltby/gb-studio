import { compile } from "../../src/lib/events/eventIfVariableValue";

test("Should be able to conditionally execute if variable matches a value", () => {
  const mockIfVariableValue = jest.fn();
  const truePath = [{ command: "EVENT_END", id: "abc" }];
  const falsePath = [{ command: "EVENT_END", id: "def" }];
  compile(
    {
      variable: "0",
      operator: "==",
      comparator: 5,
      true: truePath,
      false: falsePath,
    },
    {
      ifVariableValue: mockIfVariableValue,
    }
  );
  expect(mockIfVariableValue).toBeCalledWith(
    "0",
    ".EQ",
    5,
    truePath,
    falsePath
  );
});

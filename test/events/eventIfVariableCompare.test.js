import { compile } from "../../src/lib/events/eventIfVariableCompare";

test("Should be able to conditionally execute if variable matches another variable", () => {
  const mockIfVariableCompare = jest.fn();
  const truePath = [{ command: "EVENT_END", id: "abc" }];
  const falsePath = [{ command: "EVENT_END", id: "def" }];
  compile(
    {
      vectorX: "0",
      operator: "==",
      vectorY: "1",
      true: truePath,
      false: falsePath,
    },
    {
      ifVariableCompare: mockIfVariableCompare,
    }
  );
  expect(mockIfVariableCompare).toBeCalledWith(
    "0",
    ".EQ",
    "1",
    truePath,
    falsePath
  );
});

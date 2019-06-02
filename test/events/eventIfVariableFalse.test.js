import { compile } from "../../src/lib/events/eventIfVariableFalse";

test("Should be able to conditionally execute if variable is false", () => {
  const mockIfVariableTrue = jest.fn();
  const truePath = [{ command: "EVENT_END", id: "abc" }];
  const falsePath = [{ command: "EVENT_END", id: "def" }];
  compile(
    { variable: "0", true: truePath, false: falsePath },
    {
      ifVariableTrue: mockIfVariableTrue
    }
  );
  expect(mockIfVariableTrue).toBeCalledWith("0", falsePath, truePath);
});

import { compile } from "../../src/lib/events/eventVariablesReset";

test("Should be able to reset variables", () => {
  const mockVariablesReset = jest.fn();

  compile(
    {},
    {
      variablesReset: mockVariablesReset
    }
  );
  expect(mockVariablesReset).toBeCalled();
});

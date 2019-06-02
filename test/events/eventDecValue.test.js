import { compile } from "../../src/lib/events/eventVariableDec";

test("Should be able to decrement value", () => {
  const mockVariableDec = jest.fn();
  compile(
    {
      variable: "2"
    },
    {
      variableDec: mockVariableDec
    }
  );
  expect(mockVariableDec).toBeCalledWith("2");
});

import { compile } from "../../src/lib/events/eventSetValue";

test("Should set variable to a value", () => {
  const mockSetValue = jest.fn();
  compile(
    {
      variable: "2",
      value: 9
    },
    {
      setVariableToValue: mockSetValue
    }
  );
  expect(mockSetValue).toBeCalledWith("2", 9);
});

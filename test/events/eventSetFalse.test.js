import { compile } from "../../src/lib/events/eventSetFalse";

test("Should set variable to true", () => {
  const mockSetFalse = jest.fn();

  compile(
    {
      variable: "5"
    },
    {
      setFalse: mockSetFalse
    }
  );
  expect(mockSetFalse).toBeCalledWith("5");
});

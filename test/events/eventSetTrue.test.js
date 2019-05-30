import { compile } from "../../src/lib/events/eventSetTrue";

test("Should set variable to true", () => {
  const mockSetTrue = jest.fn();
  compile(
    {
      variable: "2"
    },
    {
      setTrue: mockSetTrue
    }
  );
  expect(mockSetTrue).toBeCalledWith("2");
});

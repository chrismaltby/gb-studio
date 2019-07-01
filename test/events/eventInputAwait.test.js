import { compile } from "../../src/lib/events/eventInputAwait";

test("Should be able to wait for a button press", () => {
  const mockInputAwait = jest.fn();
  compile(
    {
      input: ["a", "b"]
    },
    {
      inputAwait: mockInputAwait
    }
  );
  expect(mockInputAwait).toBeCalledWith(["a", "b"]);
});

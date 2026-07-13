import { compile } from "../../src/lib/events/eventInputScriptRemove";

test("Should be able to remove an input script", () => {
  const mockInputScriptRemove = jest.fn();
  compile(
    {
      input: ["a", "b"],
    },
    {
      inputScriptRemove: mockInputScriptRemove,
    },
  );
  expect(mockInputScriptRemove).toHaveBeenCalledWith(["a", "b"]);
});

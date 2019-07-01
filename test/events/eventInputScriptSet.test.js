import { compile } from "../../src/lib/events/eventInputScriptSet";

test("Should be able to set an input script", () => {
  const mockInputScriptSet = jest.fn();
  const truePath = [{ command: "EVENT_END", id: "abc" }];

  compile(
    {
      input: ["a", "b"],
      true: truePath
    },
    {
      inputScriptSet: mockInputScriptSet
    }
  );
  expect(mockInputScriptSet).toBeCalledWith(["a", "b"], truePath);
});

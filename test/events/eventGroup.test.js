import { compile } from "../../src/lib/events/eventGroup";

test("Should be able to group events", () => {
  const mockCompileEvents = jest.fn();
  const truePath = [{ command: "EVENT_END", id: "abc" }];
  compile(
    { true: truePath },
    {
      compileEvents: mockCompileEvents
    }
  );
  expect(mockCompileEvents).toBeCalledWith(truePath);
});

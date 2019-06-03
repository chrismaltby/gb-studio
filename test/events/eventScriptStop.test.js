import { compile } from "../../src/lib/events/eventScriptStop";

test("Should be able to stop script", () => {
  const mockScriptEnd = jest.fn();
  compile(
    {},
    {
      scriptEnd: mockScriptEnd
    }
  );
  expect(mockScriptEnd).toBeCalled();
});

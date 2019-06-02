import { compile } from "../../src/lib/events/eventScenePopAllState";

test("Should be able to pop all scenes from the stack", () => {
  const mockScenePopAllState = jest.fn();
  const mockScriptEnd = jest.fn();

  compile(
    {
      fadeSpeed: 2
    },
    {
      scenePopAllState: mockScenePopAllState,
      scriptEnd: mockScriptEnd
    }
  );
  expect(mockScenePopAllState).toBeCalledWith(2);
  expect(mockScriptEnd).toHaveBeenCalledAfter(mockScenePopAllState);
});

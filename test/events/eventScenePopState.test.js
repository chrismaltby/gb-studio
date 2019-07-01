import { compile } from "../../src/lib/events/eventScenePopState";

test("Should be able to pop a scene from the stack", () => {
  const mockScenePopState = jest.fn();
  const mockScriptEnd = jest.fn();

  compile(
    {
      fadeSpeed: 2
    },
    {
      scenePopState: mockScenePopState,
      scriptEnd: mockScriptEnd
    }
  );
  expect(mockScenePopState).toBeCalledWith(2);
  expect(mockScriptEnd).toHaveBeenCalledAfter(mockScenePopState);
});

import { compile } from "../../src/lib/events/eventScenePopState";

test("Should be able to pop a scene from the stack", () => {
  const mockScenePopState = jest.fn();
  const mockEndScript = jest.fn();

  compile(
    {
      fadeSpeed: 2
    },
    {
      scenePopState: mockScenePopState,
      endScript: mockEndScript
    }
  );
  expect(mockScenePopState).toBeCalledWith(2);
  expect(mockEndScript).toHaveBeenCalledAfter(mockScenePopState);
});

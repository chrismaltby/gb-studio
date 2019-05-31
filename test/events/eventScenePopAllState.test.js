import { compile } from "../../src/lib/events/eventScenePopAllState";

test("Should be able to pop all scenes from the stack", () => {
  const mockScenePopAllState = jest.fn();
  const mockEndScript = jest.fn();

  compile(
    {
      fadeSpeed: 2
    },
    {
      scenePopAllState: mockScenePopAllState,
      endScript: mockEndScript
    }
  );
  expect(mockScenePopAllState).toBeCalledWith(2);
  expect(mockEndScript).toHaveBeenCalledAfter(mockScenePopAllState);
});

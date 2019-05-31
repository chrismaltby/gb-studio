import { compile } from "../../src/lib/events/eventSceneResetState";

test("Should be able to reset the scene stack", () => {
  const mockSceneResetState = jest.fn();

  compile(
    {},
    {
      sceneResetState: mockSceneResetState
    }
  );
  expect(mockSceneResetState).toBeCalled();
});

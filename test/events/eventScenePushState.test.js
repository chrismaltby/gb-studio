import { compile } from "../../src/lib/events/eventScenePushState";

test("Should be able to push the scene to a stack", () => {
  const mockScenePushState = jest.fn();

  compile(
    {},
    {
      scenePushState: mockScenePushState
    }
  );
  expect(mockScenePushState).toBeCalled();
});

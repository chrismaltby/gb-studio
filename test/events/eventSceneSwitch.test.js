import { compile } from "../../src/lib/events/eventSceneSwitch";

test("Should be able to switch scene", () => {
  const mockSceneSwitch = jest.fn();
  const mockScriptEnd = jest.fn();

  compile(
    {
      sceneId: "2",
      x: 8,
      y: 4,
      direction: "right",
      fadeSpeed: 2
    },
    {
      sceneSwitch: mockSceneSwitch,
      scriptEnd: mockScriptEnd
    }
  );
  expect(mockSceneSwitch).toBeCalledWith("2", 8, 4, "right", 2);
  expect(mockScriptEnd).toHaveBeenCalledAfter(mockSceneSwitch);
});

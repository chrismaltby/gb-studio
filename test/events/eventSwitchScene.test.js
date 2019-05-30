import { compile } from "../../src/lib/events/eventSwitchScene";

test("Should be able to switch scene", () => {
  const mockSwitchScene = jest.fn();
  const mockEndScript = jest.fn();

  compile(
    {
      sceneId: "2",
      x: 8,
      y: 4,
      direction: "right",
      fadeSpeed: 2
    },
    {
      switchScene: mockSwitchScene,
      endScript: mockEndScript
    }
  );
  expect(mockSwitchScene).toBeCalledWith("2", 8, 4, "right", 2);
  expect(mockEndScript).toHaveBeenCalledAfter(mockSwitchScene);
});

import { compile } from "../../src/lib/events/eventSceneSwitch";

test("Should be able to switch scene", () => {
  const mockSceneSwitch = jest.fn();

  compile(
    {
      sceneId: "2",
      x: { type: "number", value: 8 },
      y: { type: "number", value: 4 },
      direction: "right",
      fadeSpeed: 2,
    },
    {
      sceneSwitchUsingScriptValues: mockSceneSwitch,
    }
  );
  expect(mockSceneSwitch).toBeCalledWith(
    "2",
    { type: "number", value: 8 },
    { type: "number", value: 4 },
    "right",
    2
  );
});

import { compile } from "../../src/lib/events/eventActorSetFrame";

test("Should set player frame", () => {
  const mockactorSetActive = jest.fn();
  const mockActorSetFrame = jest.fn();

  compile(
    {
      actorId: "player",
      frame: {
        type: "number",
        value: 4,
      },
    },
    {
      scene: { actors: [] },
      actorSetActive: mockactorSetActive,
      actorSetFrameToScriptValue: mockActorSetFrame,
    },
  );
  expect(mockactorSetActive).not.toHaveBeenCalled();
  expect(mockActorSetFrame).toHaveBeenCalledWith("player", {
    type: "number",
    value: 4,
  });
});

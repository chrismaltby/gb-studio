import { compile } from "../../src/lib/events/eventActorMoveTo";

test("Should set move player to position", () => {
  const mockactorSetActive = jest.fn();
  const mockActorMoveTo = jest.fn();

  compile(
    {
      actorId: "player",
      x: {
        type: "number",
        value: 5,
      },
      y: {
        type: "number",
        value: 9,
      },
      moveType: "horizontal",
      useCollisions: true,
      units: "tiles",
    },
    {
      scene: { actors: [] },
      actorSetActive: mockactorSetActive,
      actorMoveToScriptValues: mockActorMoveTo,
    }
  );
  expect(mockactorSetActive).not.toBeCalled();
  expect(mockActorMoveTo).toBeCalledWith(
    "player",
    { type: "number", value: 5 },
    { type: "number", value: 9 },
    true,
    "horizontal",
    "tiles"
  );
});

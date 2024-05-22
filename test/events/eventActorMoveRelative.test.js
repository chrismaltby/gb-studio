import { compile } from "../../src/lib/events/eventActorMoveRelative";

test("Should move player relatively", () => {
  const mockactorSetActive = jest.fn();
  const mockActorMoveRelative = jest.fn();

  compile(
    {
      actorId: "player",
      x: { type: "number", value: 5 },
      y: { type: "number", value: 9 },
      moveType: "horizontal",
      useCollisions: true,
      units: "tiles",
    },
    {
      scene: { actors: [] },
      actorSetActive: mockactorSetActive,
      actorMoveRelativeByScriptValues: mockActorMoveRelative,
    }
  );
  expect(mockactorSetActive).not.toBeCalled();
  expect(mockActorMoveRelative).toBeCalledWith(
    "player",
    { type: "number", value: 5 },
    { type: "number", value: 9 },
    true,
    "horizontal",
    "tiles"
  );
});

import { compile } from "../../src/lib/events/eventActorMoveRelative";

test("Should move player relatively", () => {
  const mockactorSetActive = jest.fn();
  const mockActorMoveRelative = jest.fn();

  compile(
    {
      actorId: "player",
      x: 5,
      y: 9,
      moveType: "horizontal",
      useCollisions: true      
    },
    {
      scene: { actors: [] },
      actorSetActive: mockactorSetActive,
      actorMoveRelative: mockActorMoveRelative
    },
  );
  expect(mockactorSetActive).toBeCalledWith("player");
  expect(mockActorMoveRelative).toBeCalledWith(5, 9, true, "horizontal");
});

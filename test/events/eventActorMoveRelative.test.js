import { compile } from "../../src/lib/events/eventActorMoveRelative";

test("Should move player relatively", () => {
  const mockSetActiveActor = jest.fn();
  const mockActorMoveRelative = jest.fn();

  compile(
    {
      actorId: "player",
      x: 5,
      y: 9
    },
    {
      scene: { actors: [] },
      setActiveActor: mockSetActiveActor,
      actorMoveRelative: mockActorMoveRelative
    }
  );
  expect(mockSetActiveActor).toBeCalledWith("player");
  expect(mockActorMoveRelative).toBeCalledWith(5, 9);
});

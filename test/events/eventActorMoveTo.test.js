import { compile } from "../../src/lib/events/eventActorMoveTo";

test("Should set player direction", () => {
  const mockSetActiveActor = jest.fn();
  const mockActorMoveTo = jest.fn();

  compile(
    {
      actorId: "player",
      x: 5,
      y: 9
    },
    {
      scene: { actors: [] },
      setActiveActor: mockSetActiveActor,
      actorMoveTo: mockActorMoveTo
    }
  );
  expect(mockSetActiveActor).toBeCalledWith("player");
  expect(mockActorMoveTo).toBeCalledWith(5, 9);
});

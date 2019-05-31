import { compile } from "../../src/lib/events/eventActorSetPosition";

test("Should set player position", () => {
  const mockSetActiveActor = jest.fn();
  const mockActorSetPosition = jest.fn();

  compile(
    {
      actorId: "player",
      x: 5,
      y: 9
    },
    {
      scene: { actors: [] },
      setActiveActor: mockSetActiveActor,
      actorSetPosition: mockActorSetPosition
    }
  );
  expect(mockSetActiveActor).toBeCalledWith("player");
  expect(mockActorSetPosition).toBeCalledWith(5, 9);
});

import { compile } from "../../src/lib/events/eventActorSetMovementSpeed";

test("Should be able to set the actor movement speed", () => {
  const mockSetActiveActor = jest.fn();
  const mockActorSetMovementSpeed = jest.fn();

  compile(
    {
      actorId: "player",
      speed: 3
    },
    {
      scene: { actors: [] },
      setActiveActor: mockSetActiveActor,
      actorSetMovementSpeed: mockActorSetMovementSpeed
    }
  );
  expect(mockSetActiveActor).toBeCalledWith("player");
  expect(mockActorSetMovementSpeed).toBeCalledWith(3);
});

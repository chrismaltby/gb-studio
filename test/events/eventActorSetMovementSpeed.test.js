import { compile } from "../../src/lib/events/eventActorSetMovementSpeed";

test("Should be able to set the actor movement speed", () => {
  const mockactorSetActive = jest.fn();
  const mockActorSetMovementSpeed = jest.fn();

  compile(
    {
      actorId: "player",
      speed: 3
    },
    {
      scene: { actors: [] },
      actorSetActive: mockactorSetActive,
      actorSetMovementSpeed: mockActorSetMovementSpeed
    }
  );
  expect(mockactorSetActive).toBeCalledWith("player");
  expect(mockActorSetMovementSpeed).toBeCalledWith(3);
});

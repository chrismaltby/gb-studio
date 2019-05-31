import { compile } from "../../src/lib/events/eventActorSetAnimationSpeed";

test("Should be able to set the actor animation speed", () => {
  const mockSetActiveActor = jest.fn();
  const mockActorSetAnimationSpeed = jest.fn();

  compile(
    {
      actorId: "player",
      speed: 3
    },
    {
      scene: { actors: [] },
      setActiveActor: mockSetActiveActor,
      actorSetAnimationSpeed: mockActorSetAnimationSpeed
    }
  );
  expect(mockSetActiveActor).toBeCalledWith("player");
  expect(mockActorSetAnimationSpeed).toBeCalledWith(3);
});

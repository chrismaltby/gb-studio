import { compile } from "../../src/lib/events/eventActorSetAnimationSpeed";

test("Should be able to set the actor animation speed", () => {
  const mockactorSetActive = jest.fn();
  const mockActorSetAnimationSpeed = jest.fn();

  compile(
    {
      actorId: "player",
      speed: 3
    },
    {
      scene: { actors: [] },
      actorSetActive: mockactorSetActive,
      actorSetAnimationSpeed: mockActorSetAnimationSpeed
    }
  );
  expect(mockactorSetActive).toBeCalledWith("player");
  expect(mockActorSetAnimationSpeed).toBeCalledWith(3);
});

import { compile } from "../../src/lib/events/eventActorSetCollisionBox";

test("Should set player collision box", () => {
  const mockactorSetActive = jest.fn();
  const mockActorSetBounds = jest.fn();

  compile(
    {
      actorId: "player",
      x: 8,
      y: -8,
      width: 24,
      height: 32,
    },
    {
      scene: { actors: [] },
      actorSetActive: mockactorSetActive,
      actorSetBounds: mockActorSetBounds,
    },
  );
  expect(mockactorSetActive).toHaveBeenCalledWith("player");
  expect(mockActorSetBounds).toHaveBeenCalledWith(8, 31, -8, 23);
});

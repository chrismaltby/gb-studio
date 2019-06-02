import { compile } from "../../src/lib/events/eventActorSetPosition";

test("Should set player position", () => {
  const mockactorSetActive = jest.fn();
  const mockActorSetPosition = jest.fn();

  compile(
    {
      actorId: "player",
      x: 5,
      y: 9
    },
    {
      scene: { actors: [] },
      actorSetActive: mockactorSetActive,
      actorSetPosition: mockActorSetPosition
    }
  );
  expect(mockactorSetActive).toBeCalledWith("player");
  expect(mockActorSetPosition).toBeCalledWith(5, 9);
});

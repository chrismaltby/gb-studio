import { compile } from "../../src/lib/events/eventActorSetPositionRelative";

test("Should set player position relatively", () => {
  const mockactorSetActive = jest.fn();
  const mockActorSetPositionRelative = jest.fn();

  compile(
    {
      actorId: "player",
      x: 5,
      y: 9
    },
    {
      scene: { actors: [] },
      actorSetActive: mockactorSetActive,
      actorSetPositionRelative: mockActorSetPositionRelative
    }
  );
  expect(mockactorSetActive).toBeCalledWith("player");
  expect(mockActorSetPositionRelative).toBeCalledWith(5, 9);
});

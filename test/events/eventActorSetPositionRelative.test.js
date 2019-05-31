import { compile } from "../../src/lib/events/eventActorSetPositionRelative";

test("Should set player position relatively", () => {
  const mockSetActiveActor = jest.fn();
  const mockActorSetPositionRelative = jest.fn();

  compile(
    {
      actorId: "player",
      x: 5,
      y: 9
    },
    {
      scene: { actors: [] },
      setActiveActor: mockSetActiveActor,
      actorSetPositionRelative: mockActorSetPositionRelative
    }
  );
  expect(mockSetActiveActor).toBeCalledWith("player");
  expect(mockActorSetPositionRelative).toBeCalledWith(5, 9);
});

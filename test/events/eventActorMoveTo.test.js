import { compile } from "../../src/lib/events/eventActorMoveTo";

test("Should set move player to position", () => {
  const mockactorSetActive = jest.fn();
  const mockActorMoveTo = jest.fn();

  compile(
    {
      actorId: "player",
      x: {
        type: "number",
        value: 5
      },
      y: {
        type: "number",
        value: 9
      },
      moveType: "horizontal",
      useCollisions: true
    },
    {
      scene: { actors: [] },
      actorSetActive: mockactorSetActive,
      actorMoveTo: mockActorMoveTo
    }
  );
  expect(mockactorSetActive).toBeCalledWith("player");
  expect(mockActorMoveTo).toBeCalledWith(5, 9, true, "horizontal");
});

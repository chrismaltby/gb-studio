import { compile } from "../../src/lib/events/eventIfActorAtPosition";

test("Should be able to conditionally execute if actor is at a position", () => {
  const mockactorSetActive = jest.fn();
  const mockIfActorAtPosition = jest.fn();
  const truePath = [{ command: "EVENT_END", id: "abc" }];
  const falsePath = [{ command: "EVENT_END", id: "def" }];
  compile(
    {
      actorId: "player",
      x: 4,
      y: 8,
      true: truePath,
      false: falsePath
    },
    {
      actorSetActive: mockactorSetActive,
      ifActorAtPosition: mockIfActorAtPosition
    }
  );
  expect(mockactorSetActive).toBeCalledWith("player");
  expect(mockIfActorAtPosition).toBeCalledWith(4, 8, truePath, falsePath);
});

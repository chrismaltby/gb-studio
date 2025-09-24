import { compile } from "../../src/lib/events/eventIfActorAtPosition";

test("Should be able to conditionally execute if actor is at a position", () => {
  const mockactorSetActive = jest.fn();
  const mockIfActorAtPosition = jest.fn();
  const truePath = [{ command: "EVENT_END", id: "abc" }];
  const falsePath = [{ command: "EVENT_END", id: "def" }];
  compile(
    {
      actorId: "player",
      x: { type: "number", value: 4 },
      y: { type: "number", value: 8 },
      units: "tiles",
      true: truePath,
      false: falsePath,
    },
    {
      actorSetActive: mockactorSetActive,
      ifActorAtPositionByScriptValues: mockIfActorAtPosition,
    },
  );
  expect(mockactorSetActive).not.toBeCalled();
  expect(mockIfActorAtPosition).toBeCalledWith(
    "player",
    { type: "number", value: 4 },
    { type: "number", value: 8 },
    truePath,
    falsePath,
    "tiles",
  );
});

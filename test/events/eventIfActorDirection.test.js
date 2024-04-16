import { compile } from "../../src/lib/events/eventIfActorDirection";

test("Should be able to conditionally execute if actor is facing a direction", () => {
  const mockactorSetActive = jest.fn();
  const mockIfActorDirection = jest.fn();
  const truePath = [{ command: "EVENT_END", id: "abc" }];
  const falsePath = [{ command: "EVENT_END", id: "def" }];
  compile(
    {
      actorId: "player",
      direction: { type: "direction", value: "right" },
      true: truePath,
      false: falsePath,
    },
    {
      actorSetActive: mockactorSetActive,
      ifActorDirectionScriptValue: mockIfActorDirection,
    }
  );
  expect(mockactorSetActive).not.toBeCalled();
  expect(mockIfActorDirection).toBeCalledWith(
    "player",
    { type: "direction", value: "right" },
    truePath,
    falsePath
  );
});

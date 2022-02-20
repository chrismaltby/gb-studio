import { compile } from "../../src/lib/events/eventIfActorDirection";

test("Should be able to conditionally execute if actor is within range of actor", () => {
  const mockActorSetActive = jest.fn();
  const mockIfActorDistanceFromActor = jest.fn();
  const truePath = [{ command: "EVENT_END", id: "abc" }];
  const falsePath = [{ command: "EVENT_END", id: "def" }];
  compile(
    {
      actorId: "actor1",
      otherActorId: "actor2",
      distance: 5,
      true: truePath,
      false: falsePath
    },
    {
      actorSetActive: mockActorSetActive,
      ifActorDistanceFromActor: mockIfActorDistanceFromActor
    }
  );
  expect(mockActorSetActive).toBeCalledWith("actor1");
  expect(mockIfActorDistanceFromActor).toBeCalledWith(5, "actor2", truePath, falsePath);
});

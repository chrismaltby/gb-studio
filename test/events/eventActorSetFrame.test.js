import { compile } from "../../src/lib/events/eventActorSetFrame";

test("Should set player frame", () => {
  const mockSetActiveActor = jest.fn();
  const mockActorSetFrame = jest.fn();

  compile(
    {
      actorId: "player",
      frame: 4
    },
    {
      scene: { actors: [] },
      setActiveActor: mockSetActiveActor,
      actorSetFrame: mockActorSetFrame
    }
  );
  expect(mockSetActiveActor).toBeCalledWith("player");
  expect(mockActorSetFrame).toBeCalledWith(4);
});

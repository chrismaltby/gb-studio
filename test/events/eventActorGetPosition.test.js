import { compile } from "../../src/lib/events/eventActorGetPosition";

test("Should set player position to variables", () => {
  const mockSetActiveActor = jest.fn();
  const mockActorGetPosition = jest.fn();

  compile(
    {
      actorId: "player",
      vectorX: "0",
      vectorY: "1"
    },
    {
      scene: { actors: [] },
      variables: ["0", "1"],
      setActiveActor: mockSetActiveActor,
      actorGetPosition: mockActorGetPosition
    }
  );
  expect(mockSetActiveActor).toBeCalledWith("player");
  expect(mockActorGetPosition).toBeCalledWith("0", "1");
});

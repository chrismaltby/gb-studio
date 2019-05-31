import { compile } from "../../src/lib/events/eventActorMoveToVariables";

test("Should move player position to variables", () => {
  const mockSetActiveActor = jest.fn();
  const mockActorMoveToVariables = jest.fn();

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
      actorMoveToVariables: mockActorMoveToVariables
    }
  );
  expect(mockSetActiveActor).toBeCalledWith("player");
  expect(mockActorMoveToVariables).toBeCalledWith("0", "1");
});

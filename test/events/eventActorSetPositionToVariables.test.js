import { compile } from "../../src/lib/events/eventActorSetPositionToVariables";

test("Should set player position to variables", () => {
  const mockSetActiveActor = jest.fn();
  const mockActorSetPositionToVariables = jest.fn();

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
      actorSetPositionToVariables: mockActorSetPositionToVariables
    }
  );
  expect(mockSetActiveActor).toBeCalledWith("player");
  expect(mockActorSetPositionToVariables).toBeCalledWith("0", "1");
});

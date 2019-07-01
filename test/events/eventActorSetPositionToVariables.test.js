import { compile } from "../../src/lib/events/eventActorSetPositionToVariables";

test("Should set player position to variables", () => {
  const mockactorSetActive = jest.fn();
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
      actorSetActive: mockactorSetActive,
      actorSetPositionToVariables: mockActorSetPositionToVariables
    }
  );
  expect(mockactorSetActive).toBeCalledWith("player");
  expect(mockActorSetPositionToVariables).toBeCalledWith("0", "1");
});

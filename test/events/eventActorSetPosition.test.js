import { compile } from "../../src/lib/events/eventActorSetPosition";

test("Should set player position", () => {
  const mockactorSetActive = jest.fn();
  const mockActorSetPosition = jest.fn();

  compile(
    {
      actorId: "player",
      x: {
        type: "number",
        value: 5,
      },
      y: {
        type: "number",
        value: 9,
      },
      units: "tiles",
    },
    {
      scene: { actors: [] },
      actorSetActive: mockactorSetActive,
      actorSetPositionToScriptValues: mockActorSetPosition,
    }
  );
  expect(mockactorSetActive).not.toBeCalled();
  expect(mockActorSetPosition).toBeCalledWith(
    "player",
    { type: "number", value: 5 },
    { type: "number", value: 9 },
    "tiles"
  );
});

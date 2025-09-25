import { compile } from "../../src/lib/events/eventActorSetPositionRelative";

test("Should set player position relatively", () => {
  const mockactorSetActive = jest.fn();
  const mockActorSetPositionRelative = jest.fn();

  compile(
    {
      actorId: "player",
      x: { type: "number", value: 5 },
      y: { type: "number", value: 9 },
      units: "tiles",
    },
    {
      scene: { actors: [] },
      actorSetActive: mockactorSetActive,
      actorSetPositionRelativeByScriptValues: mockActorSetPositionRelative,
    },
  );
  expect(mockActorSetPositionRelative).toBeCalledWith(
    "player",
    { type: "number", value: 5 },
    { type: "number", value: 9 },
    "tiles",
  );
  expect(mockactorSetActive).not.toBeCalled();
});

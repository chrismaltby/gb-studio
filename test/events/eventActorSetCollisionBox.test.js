import { compile } from "../../src/lib/events/eventActorSetCollisionBox";

test("Should set player collision box", () => {
  const mockActorSetBoundToScriptValues = jest.fn();

  compile(
    {
      actorId: "player",
      x: { type: "number", value: 8 },
      y: { type: "number", value: -8 },
      width: { type: "number", value: 24 },
      height: { type: "number", value: 32 },
    },
    {
      scene: { actors: [] },
      actorSetBoundToScriptValues: mockActorSetBoundToScriptValues,
    },
  );
  expect(mockActorSetBoundToScriptValues).toHaveBeenCalledWith(
    "player",
    { type: "number", value: 8 },
    { type: "number", value: -8 },
    { type: "number", value: 24 },
    { type: "number", value: 32 },
  );
});

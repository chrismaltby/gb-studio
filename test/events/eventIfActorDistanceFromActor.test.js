import { compile } from "../../src/lib/events/eventIfActorDistanceFromActor";

test("Should be able to conditionally execute if actor is within range of actor", () => {
  const mockActorSetActive = jest.fn();
  const mockIfActorDistanceFromActor = jest.fn();
  const mockIfActorDistanceVariableFromActor = jest.fn();
  const mockVariableFromUnion = jest.fn().mockReturnValue(10);
  const mockTemporaryEntityVariable = jest.fn().mockReturnValue("ok");
  const truePath = [{ command: "EVENT_END", id: "abc" }];
  const falsePath = [{ command: "EVENT_END", id: "def" }];
  compile(
    {
      actorId: "actor1",
      otherActorId: "actor2",
      operator: "<=",
      distance: {
        type: "number",
        value: 5,
      },
      true: truePath,
      false: falsePath,
    },
    {
      actorSetActive: mockActorSetActive,
      ifActorDistanceScriptValueFromActor: mockIfActorDistanceFromActor,
      variableFromUnion: mockVariableFromUnion,
      temporaryEntityVariable: mockTemporaryEntityVariable,
    },
  );
  expect(mockIfActorDistanceFromActor).toBeCalledWith(
    "actor1",
    { type: "number", value: 5 },
    ".LTE",
    "actor2",
    truePath,
    falsePath,
  );
  expect(mockActorSetActive).not.toBeCalled();
  expect(mockVariableFromUnion).not.toBeCalled();
  expect(mockTemporaryEntityVariable).not.toBeCalled();

  let variable = {
    type: "variable",
    value: "L0",
  };

  compile(
    {
      actorId: "actor1",
      otherActorId: "actor2",
      operator: "==",
      distance: variable,
      true: truePath,
      false: falsePath,
    },
    {
      actorSetActive: mockActorSetActive,
      ifActorDistanceScriptValueFromActor: mockIfActorDistanceVariableFromActor,
      variableFromUnion: mockVariableFromUnion,
      temporaryEntityVariable: mockTemporaryEntityVariable,
    },
  );

  expect(mockIfActorDistanceVariableFromActor).toBeCalledWith(
    "actor1",
    { type: "variable", value: "L0" },
    ".EQ",
    "actor2",
    truePath,
    falsePath,
  );
  expect(mockActorSetActive).not.toBeCalled();
  expect(mockVariableFromUnion).not.toBeCalled();
  expect(mockTemporaryEntityVariable).not.toBeCalled();
});

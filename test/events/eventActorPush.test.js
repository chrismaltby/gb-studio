import { compile } from "../../src/lib/events/eventActorPush";

test("Should be able to push actor", () => {
  const mockSetActiveActor = jest.fn();
  const mockActorPush = jest.fn();

  compile(
    {
      continue: false
    },
    {
      entityType: "actor",
      entity: {
        id: "abc"
      },
      setActiveActor: mockSetActiveActor,
      actorPush: mockActorPush
    }
  );
  expect(mockSetActiveActor).toBeCalledWith("abc");
  expect(mockActorPush).toBeCalledWith(false);
});

test("Should not be able to push trigger", () => {
  const mockSetActiveActor = jest.fn();
  const mockActorPush = jest.fn();

  compile(
    {
      continue: false
    },
    {
      entityType: "trigger",
      entity: {
        id: "abc"
      },
      setActiveActor: mockSetActiveActor,
      actorPush: mockActorPush
    }
  );
  expect(mockSetActiveActor).not.toBeCalled();
  expect(mockActorPush).not.toBeCalled();
});

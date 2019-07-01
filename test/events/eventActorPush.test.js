import { compile } from "../../src/lib/events/eventActorPush";

test("Should be able to push actor", () => {
  const mockactorSetActive = jest.fn();
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
      actorSetActive: mockactorSetActive,
      actorPush: mockActorPush
    }
  );
  expect(mockactorSetActive).toBeCalledWith("abc");
  expect(mockActorPush).toBeCalledWith(false);
});

test("Should not be able to push trigger", () => {
  const mockactorSetActive = jest.fn();
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
      actorSetActive: mockactorSetActive,
      actorPush: mockActorPush
    }
  );
  expect(mockactorSetActive).not.toBeCalled();
  expect(mockActorPush).not.toBeCalled();
});

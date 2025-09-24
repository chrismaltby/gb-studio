import { compile } from "../../src/lib/events/eventActorSetState";

test("Should be able to set actor state", () => {
  const mockactorSetActive = jest.fn();
  const mockActorSetState = jest.fn();

  compile(
    {
      actorId: "abc",
      spriteStateId: "state1",
      loopAnim: true,
    },
    {
      actorSetActive: mockactorSetActive,
      actorSetState: mockActorSetState,
    },
  );
  expect(mockactorSetActive).toBeCalledWith("abc");
  expect(mockActorSetState).toBeCalledWith("state1", true);
});

test("Should be able to prevent actor state animation from looping", () => {
  const mockactorSetActive = jest.fn();
  const mockActorSetState = jest.fn();

  compile(
    {
      actorId: "abc",
      spriteStateId: "state1",
      loopAnim: false,
    },
    {
      actorSetActive: mockactorSetActive,
      actorSetState: mockActorSetState,
    },
  );
  expect(mockactorSetActive).toBeCalledWith("abc");
  expect(mockActorSetState).toBeCalledWith("state1", false);
});

test("Should provide undefined loop value if no loop value provided (actorSetState handles this case)", () => {
  const mockactorSetActive = jest.fn();
  const mockActorSetState = jest.fn();

  compile(
    {
      actorId: "abc",
      spriteStateId: "state1",
    },
    {
      actorSetActive: mockactorSetActive,
      actorSetState: mockActorSetState,
    },
  );
  expect(mockactorSetActive).toBeCalledWith("abc");
  expect(mockActorSetState).toBeCalledWith("state1", undefined);
});

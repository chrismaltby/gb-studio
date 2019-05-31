import { compile } from "../../src/lib/events/eventActorInvoke";

test("Should be able to invoke actor script", () => {
  const mockSetActiveActor = jest.fn();
  const mockActorInvoke = jest.fn();

  compile(
    {
      actorId: "abc"
    },
    {
      setActiveActor: mockSetActiveActor,
      actorInvoke: mockActorInvoke
    }
  );
  expect(mockSetActiveActor).toBeCalledWith("abc");
  expect(mockActorInvoke).toBeCalled();
});

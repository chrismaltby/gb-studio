import { compile } from "../../src/lib/events/eventActorInvoke";

test("Should be able to invoke actor script", () => {
  const mockactorSetActive = jest.fn();
  const mockActorInvoke = jest.fn();

  compile(
    {
      actorId: "abc"
    },
    {
      actorSetActive: mockactorSetActive,
      actorInvoke: mockActorInvoke
    }
  );
  expect(mockactorSetActive).toBeCalledWith("abc");
  expect(mockActorInvoke).toBeCalled();
});

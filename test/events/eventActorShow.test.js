import { compile } from "../../src/lib/events/eventActorShow";

test("Should be able to show actor", () => {
  const mockactorSetActive = jest.fn();
  const mockActorShow = jest.fn();

  compile(
    {
      actorId: "abc"
    },
    {
      actorSetActive: mockactorSetActive,
      actorShow: mockActorShow
    }
  );
  expect(mockactorSetActive).toBeCalledWith("abc");
  expect(mockActorShow).toBeCalled();
});

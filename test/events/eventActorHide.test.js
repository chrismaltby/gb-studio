import { compile } from "../../src/lib/events/eventActorHide";

test("Should be able to hide actor", () => {
  const mockactorSetActive = jest.fn();
  const mockActorHide = jest.fn();

  compile(
    {
      actorId: "abc"
    },
    {
      actorSetActive: mockactorSetActive,
      actorHide: mockActorHide
    }
  );
  expect(mockactorSetActive).toBeCalledWith("abc");
  expect(mockActorHide).toBeCalled();
});

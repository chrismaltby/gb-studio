import { compile } from "../../src/lib/events/eventActorHide";

test("Should be able to hide actor", () => {
  const mockSetActiveActor = jest.fn();
  const mockActorHide = jest.fn();

  compile(
    {
      actorId: "abc"
    },
    {
      setActiveActor: mockSetActiveActor,
      actorHide: mockActorHide
    }
  );
  expect(mockSetActiveActor).toBeCalledWith("abc");
  expect(mockActorHide).toBeCalled();
});

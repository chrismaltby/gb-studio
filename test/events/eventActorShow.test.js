import { compile } from "../../src/lib/events/eventActorShow";

test("Should be able to show actor", () => {
  const mockSetActiveActor = jest.fn();
  const mockActorShow = jest.fn();

  compile(
    {
      actorId: "abc"
    },
    {
      setActiveActor: mockSetActiveActor,
      actorShow: mockActorShow
    }
  );
  expect(mockSetActiveActor).toBeCalledWith("abc");
  expect(mockActorShow).toBeCalled();
});

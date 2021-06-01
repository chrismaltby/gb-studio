import { compile } from "../../src/lib/events/eventActorShow";

test("Should be able to show actor", () => {
  const mockActorShow = jest.fn();

  compile(
    {
      actorId: "abc",
    },
    {
      actorShow: mockActorShow,
    }
  );
  expect(mockActorShow).toBeCalledWith("abc");
});

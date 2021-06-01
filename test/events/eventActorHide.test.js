import { compile } from "../../src/lib/events/eventActorHide";

test("Should be able to hide actor", () => {
  const mockActorHide = jest.fn();

  compile(
    {
      actorId: "abc",
    },
    {
      actorHide: mockActorHide,
    }
  );
  expect(mockActorHide).toBeCalledWith("abc");
});

import { compile } from "../../src/lib/events/eventActorEmote";

test("Should be able to display actor emote", () => {
  const mockSetActiveActor = jest.fn();
  const mockActorEmote = jest.fn();

  compile(
    {
      actorId: "abc",
      emoteId: 2
    },
    {
      setActiveActor: mockSetActiveActor,
      actorEmote: mockActorEmote
    }
  );
  expect(mockSetActiveActor).toBeCalledWith("abc");
  expect(mockActorEmote).toBeCalledWith(2);
});

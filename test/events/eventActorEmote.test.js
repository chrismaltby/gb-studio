import { compile } from "../../src/lib/events/eventActorEmote";

test("Should be able to display actor emote", () => {
  const mockactorSetActive = jest.fn();
  const mockActorEmote = jest.fn();

  compile(
    {
      actorId: "abc",
      emoteId: 2
    },
    {
      actorSetActive: mockactorSetActive,
      actorEmote: mockActorEmote
    }
  );
  expect(mockactorSetActive).toBeCalledWith("abc");
  expect(mockActorEmote).toBeCalledWith(2);
});

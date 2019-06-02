export const id = "EVENT_ACTOR_EMOTE";

export const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "player"
  },
  {
    key: "emoteId",
    type: "emote",
    defaultValue: 0
  }
];

export const compile = (input, helpers) => {
  const { actorSetActive, actorEmote } = helpers;
  actorSetActive(input.actorId);
  actorEmote(input.emoteId);
};

const id = "EVENT_ACTOR_EMOTE";

const fields = [
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

const compile = (input, helpers) => {
  const { actorSetActive, actorEmote } = helpers;
  actorSetActive(input.actorId);
  actorEmote(input.emoteId);
};

module.exports = {
  id,
  fields,
  compile
};

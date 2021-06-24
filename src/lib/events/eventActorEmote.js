const id = "EVENT_ACTOR_EMOTE";
const group = "EVENT_GROUP_ACTOR";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "emoteId",
    type: "emote",
    defaultValue: 0,
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorEmote } = helpers;
  actorSetActive(input.actorId);
  actorEmote(input.emoteId);
};

module.exports = {
  id,
  group,
  fields,
  compile,
};

const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_EMOTE";
const groups = ["EVENT_GROUP_ACTOR"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ACTOR_EMOTE_LABEL", {
    actor: fetchArg("actorId"),
    emote: fetchArg("emoteId"),
  });
};

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "emoteId",
    type: "emote",
    defaultValue: "LAST_EMOTE",
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorEmote } = helpers;
  actorSetActive(input.actorId);
  actorEmote(input.emoteId);
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};

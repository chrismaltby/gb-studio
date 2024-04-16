const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_EMOTE";
const groups = ["EVENT_GROUP_ACTOR"];
const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_ACTIONS",
};

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ACTOR_EMOTE_LABEL", {
    actor: fetchArg("actorId"),
    emote: fetchArg("emoteId"),
  });
};

const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description: l10n("FIELD_ACTOR_EMOTE_DESC"),
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "emoteId",
    label: l10n("FIELD_EMOTE"),
    description: l10n("FIELD_EMOTE_DESC"),
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
  description: l10n("EVENT_ACTOR_EMOTE_DESC"),
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};

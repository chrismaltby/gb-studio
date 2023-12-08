const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_ACTIVATE";
const groups = ["EVENT_GROUP_ACTOR"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ACTOR_ACTIVATE_LABEL", {
    actor: fetchArg("actorId"),
  });
};

const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description: l10n("FIELD_ACTOR_ACTIVATE_DESC"),
    type: "actor",
    defaultValue: "$self$",
  },
];

const compile = (input, helpers) => {
  const { actorActivate } = helpers;
  actorActivate(input.actorId);
};

module.exports = {
  id,
  description: l10n("EVENT_ACTOR_ACTIVATE_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
};

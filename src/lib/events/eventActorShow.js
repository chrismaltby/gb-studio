const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_SHOW";
const groups = ["EVENT_GROUP_ACTOR"];
const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_VISIBILITY",
};

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ACTOR_SHOW_LABEL", {
    actor: fetchArg("actorId"),
  });
};

const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description: l10n("FIELD_ACTOR_SHOW_DESC"),
    type: "actor",
    defaultValue: "$self$",
  },
];

const compile = (input, helpers) => {
  const { actorShow } = helpers;
  actorShow(input.actorId);
};

module.exports = {
  id,
  description: l10n("EVENT_ACTOR_SHOW_DESC"),
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
};

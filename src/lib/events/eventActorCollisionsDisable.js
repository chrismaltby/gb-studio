const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_COLLISIONS_DISABLE";
const groups = ["EVENT_GROUP_ACTOR"];
const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_PROPERTIES",
};

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ACTOR_COLLISIONS_DISABLE_LABEL", {
    actor: fetchArg("actorId"),
  });
};

const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description: l10n("FIELD_ACTOR_UPDATE_DESC"),
    type: "actor",
    defaultValue: "$self$",
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorSetCollisions } = helpers;
  actorSetActive(input.actorId);
  actorSetCollisions(false);
};

module.exports = {
  id,
  description: l10n("EVENT_ACTOR_COLLISIONS_DISABLE_DESC"),
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
};

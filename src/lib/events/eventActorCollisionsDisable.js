const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_COLLISIONS_DISABLE";
const groups = ["EVENT_GROUP_ACTOR"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ACTOR_COLLISIONS_DISABLE_LABEL", {
    actor: fetchArg("actorId"),
  });
};

const fields = [
  {
    key: "actorId",
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
  autoLabel,
  groups,
  fields,
  compile,
};

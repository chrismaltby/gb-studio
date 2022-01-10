const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_GET_DIRECTION";
const groups = ["EVENT_GROUP_ACTOR"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ACTOR_GET_DIRECTION_LABEL", {
    actor: fetchArg("actorId"),
    variable: fetchArg("direction"),
  });
};

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "direction",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorGetDirection } = helpers;
  actorSetActive(input.actorId);
  actorGetDirection(input.direction);
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};

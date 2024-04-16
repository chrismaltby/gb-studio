const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_GET_DIRECTION";
const groups = ["EVENT_GROUP_ACTOR", "EVENT_GROUP_VARIABLES"];
const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_VARIABLES",
  EVENT_GROUP_VARIABLES: "EVENT_GROUP_ACTOR",
};

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ACTOR_GET_DIRECTION_LABEL", {
    actor: fetchArg("actorId"),
    variable: fetchArg("direction"),
  });
};

const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description: l10n("FIELD_ACTOR_CHECK_DESC"),
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "direction",
    label: l10n("FIELD_VARIABLE"),
    description: l10n("FIELD_DIRECTION_VARIABLE_DESC"),
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
  description: l10n("EVENT_ACTOR_GET_DIRECTION_DESC"),
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
};

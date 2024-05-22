const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_SET_MOVEMENT_SPEED";
const groups = ["EVENT_GROUP_ACTOR"];
const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_PROPERTIES",
};

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ACTOR_SET_MOVEMENT_SPEED_LABEL", {
    actor: fetchArg("actorId"),
    speed: fetchArg("speed"),
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
  {
    key: "speed",
    label: l10n("FIELD_SPEED"),
    description: l10n("FIELD_SPEED_DESC"),
    type: "moveSpeed",
    defaultValue: 1,
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorSetMovementSpeed } = helpers;
  actorSetActive(input.actorId);
  actorSetMovementSpeed(input.speed);
};

module.exports = {
  id,
  description: l10n("EVENT_ACTOR_SET_MOVEMENT_SPEED_DESC"),
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
};

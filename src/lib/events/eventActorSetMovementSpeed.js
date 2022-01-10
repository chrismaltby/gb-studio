const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_SET_MOVEMENT_SPEED";
const groups = ["EVENT_GROUP_ACTOR"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ACTOR_SET_MOVEMENT_SPEED_LABEL", {
    actor: fetchArg("actorId"),
    speed: fetchArg("speed"),
  });
};

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "speed",
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
  autoLabel,
  groups,
  fields,
  compile,
};

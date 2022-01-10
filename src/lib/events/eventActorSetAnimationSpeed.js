const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_SET_ANIMATION_SPEED";
const groups = ["EVENT_GROUP_ACTOR"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ACTOR_SET_ANIMATION_SPEED_LABEL", {
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
    type: "animSpeed",
    defaultValue: 15,
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorSetAnimationSpeed } = helpers;
  actorSetActive(input.actorId);
  actorSetAnimationSpeed(input.speed);
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};

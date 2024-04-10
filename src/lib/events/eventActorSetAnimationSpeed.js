const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_SET_ANIMATION_SPEED";
const groups = ["EVENT_GROUP_ACTOR"];
const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_PROPERTIES",
};

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ACTOR_SET_ANIMATION_SPEED_LABEL", {
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
    label: l10n("FIELD_ANIMATION_SPEED"),
    description: l10n("FIELD_ANIMATION_SPEED_DESC"),
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
  description: l10n("EVENT_ACTOR_SET_ANIMATION_SPEED_DESC"),
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
};

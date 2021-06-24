const id = "EVENT_ACTOR_SET_ANIMATION_SPEED";
const group = "EVENT_GROUP_ACTOR";

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
  group,
  fields,
  compile,
  allowedBeforeInitFade: true,
};

const id = "EVENT_ACTOR_SET_ANIMATION_SPEED";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$"
  },
  {
    key: "speed",
    type: "animSpeed",
    defaultValue: "3"
  }
];

const compile = (input, helpers) => {
  const { actorSetActive, actorSetAnimationSpeed } = helpers;
  actorSetActive(input.actorId);
  actorSetAnimationSpeed(input.speed);
};

module.exports = {
  id,
  fields,
  compile
};

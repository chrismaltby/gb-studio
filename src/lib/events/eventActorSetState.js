const id = "EVENT_ACTOR_SET_STATE";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "spriteStateId",
    type: "animationstate",
    defaultValue: "LAST_SPRITE",
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorSetState } = helpers;
  actorSetActive(input.actorId);
  actorSetState(input.spriteStateId);
};

module.exports = {
  id,
  fields,
  compile,
  allowedBeforeInitFade: true,
};

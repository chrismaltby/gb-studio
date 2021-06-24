const id = "EVENT_ACTOR_SET_STATE";
const groups = ["EVENT_GROUP_ACTOR"];

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "spriteStateId",
    type: "animationstate",
    defaultValue: "",
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorSetState } = helpers;
  actorSetActive(input.actorId);
  actorSetState(input.spriteStateId);
};

module.exports = {
  id,
  groups,
  fields,
  compile,
  allowedBeforeInitFade: true,
};

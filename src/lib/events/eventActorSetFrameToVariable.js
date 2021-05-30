const id = "EVENT_ACTOR_SET_FRAME_TO_VALUE";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$"
  },
  {
    key: "variable",
    type: "variable",
    defaultValue: "LAST_VARIABLE"
  }
];

const compile = (input, helpers) => {
  const { actorSetActive, actorSetFrameToVariable } = helpers;
  actorSetActive(input.actorId);
  actorSetFrameToVariable(input.variable);
};

module.exports = {
  id,
  fields,
  compile
};

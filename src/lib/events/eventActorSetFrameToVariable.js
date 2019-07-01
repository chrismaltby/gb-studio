export const id = "EVENT_ACTOR_SET_FRAME_TO_VALUE";

export const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "LAST_ACTOR"
  },
  {
    key: "variable",
    type: "variable",
    defaultValue: "LAST_VARIABLE"
  }
];

export const compile = (input, helpers) => {
  const { actorSetActive, actorSetFrameToVariable } = helpers;
  actorSetActive(input.actorId);
  actorSetFrameToVariable(input.variable);
};

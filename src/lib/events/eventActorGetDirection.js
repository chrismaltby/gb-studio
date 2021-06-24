const id = "EVENT_ACTOR_GET_DIRECTION";
const groups = ["EVENT_GROUP_ACTOR"];

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "direction",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorGetDirection } = helpers;
  actorSetActive(input.actorId);
  actorGetDirection(input.direction);
};

module.exports = {
  id,
  groups,
  fields,
  compile,
  allowedBeforeInitFade: true,
};

const id = "EVENT_ACTOR_GET_DIRECTION";

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
  fields,
  compile,
  allowedBeforeInitFade: true,
};

const id = "EVENT_ACTOR_SHOW";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$",
  },
];

const compile = (input, helpers) => {
  const { actorShow } = helpers;
  actorShow(input.actorId);
};

module.exports = {
  id,
  fields,
  compile,
};

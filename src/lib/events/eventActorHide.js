const id = "EVENT_ACTOR_HIDE";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$",
  },
];

const compile = (input, helpers) => {
  const { actorHide } = helpers;
  actorHide(input.actorId);
};

module.exports = {
  id,
  fields,
  compile,
};

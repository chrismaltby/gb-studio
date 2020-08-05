const id = "EVENT_ACTOR_SHOW";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$"
  }
];

const compile = (input, helpers) => {
  const { actorSetActive, actorShow } = helpers;
  actorSetActive(input.actorId);
  actorShow();
};

module.exports = {
  id,
  fields,
  compile
};

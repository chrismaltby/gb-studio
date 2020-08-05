const id = "EVENT_ACTOR_COLLISIONS_ENABLE";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$"
  }
];

const compile = (input, helpers) => {
  const { actorSetActive, actorSetCollisions } = helpers;
  actorSetActive(input.actorId);
  actorSetCollisions(true);
};

module.exports = {
  id,
  fields,
  compile
};

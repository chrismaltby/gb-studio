const id = "EVENT_ACTOR_COLLISIONS_DISABLE";
const groups = ["EVENT_GROUP_ACTOR"];

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$",
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorSetCollisions } = helpers;
  actorSetActive(input.actorId);
  actorSetCollisions(false);
};

module.exports = {
  id,
  groups,
  fields,
  compile,
  allowedBeforeInitFade: true,
};

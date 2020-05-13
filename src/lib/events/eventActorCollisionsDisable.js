const id = "EVENT_ACTOR_COLLISIONS_DISABLE";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "player"
  }
];

const compile = (input, helpers) => {
  const { actorSetActive, actorSetCollisions } = helpers;
  actorSetActive(input.actorId);
  actorSetCollisions(false);
};

module.exports = {
  id,
  fields,
  compile
};

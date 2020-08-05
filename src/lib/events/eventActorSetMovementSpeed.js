const id = "EVENT_ACTOR_SET_MOVEMENT_SPEED";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$"
  },
  {
    key: "speed",
    type: "moveSpeed",
    defaultValue: "1"
  }
];

const compile = (input, helpers) => {
  const { actorSetActive, actorSetMovementSpeed } = helpers;
  actorSetActive(input.actorId);
  actorSetMovementSpeed(input.speed);
};

module.exports = {
  id,
  fields,
  compile
};

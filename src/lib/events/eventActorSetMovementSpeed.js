export const id = "EVENT_ACTOR_SET_MOVEMENT_SPEED";

export const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "player"
  },
  {
    key: "speed",
    type: "moveSpeed",
    defaultValue: "1"
  }
];

export const compile = (input, helpers) => {
  const { actorSetActive, actorSetMovementSpeed } = helpers;
  actorSetActive(input.actorId);
  actorSetMovementSpeed(input.speed);
};

export const id = "EVENT_ACTOR_COLLISIONS_ENABLE";

export const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "player"
  }
];

export const compile = (input, helpers) => {
  const { actorSetActive, actorSetCollisions } = helpers;
  actorSetActive(input.actorId);
  actorSetCollisions(true);
};

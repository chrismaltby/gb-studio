export const id = "EVENT_ACTOR_SET_ANIMATION_SPEED";

export const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "player"
  },
  {
    key: "speed",
    type: "animSpeed",
    defaultValue: "3"
  }
];

export const compile = (input, helpers) => {
  const { setActiveActor, actorSetAnimationSpeed } = helpers;
  setActiveActor(input.actorId);
  actorSetAnimationSpeed(input.speed);
};

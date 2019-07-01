export const id = "EVENT_ACTOR_SHOW";

export const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "player"
  }
];

export const compile = (input, helpers) => {
  const { actorSetActive, actorShow } = helpers;
  actorSetActive(input.actorId);
  actorShow();
};

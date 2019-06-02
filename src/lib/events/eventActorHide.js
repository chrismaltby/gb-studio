export const id = "EVENT_ACTOR_HIDE";

export const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "player"
  }
];

export const compile = (input, helpers) => {
  const { actorSetActive, actorHide } = helpers;
  actorSetActive(input.actorId);
  actorHide();
};

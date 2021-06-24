const id = "EVENT_ACTOR_SET_SPRITE";
const group = "EVENT_GROUP_ACTOR";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "spriteSheetId",
    type: "sprite",
    defaultValue: "LAST_SPRITE",
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorSetSprite } = helpers;
  actorSetActive(input.actorId);
  actorSetSprite(input.spriteSheetId);
};

module.exports = {
  id,
  group,
  fields,
  compile,
  allowedBeforeInitFade: true,
};

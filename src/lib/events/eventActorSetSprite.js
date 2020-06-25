const id = "EVENT_ACTOR_SET_SPRITE";

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
  const { actorSetActive, actorSetSprite, playerSetSprite, getActorById } = helpers;
  if(!getActorById(input.actorId)) {
    playerSetSprite(input.spriteSheetId);
  } else {
    actorSetActive(input.actorId); 
    actorSetSprite(input.spriteSheetId);
  }
};

module.exports = {
  id,
  fields,
  compile,
};

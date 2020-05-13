const getSprite = require("./helpers").getSprite;
const directionToFrame = require("../helpers/gbstudio").directionToFrame;

const id = "EVENT_ACTOR_SET_DIRECTION";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "player",
  },
  {
    key: "direction",
    type: "direction",
    defaultValue: "up",
  },
];

const compile = (input, helpers) => {
  const {
    getActorById,
    actorSetActive,
    actorSetDirection,
    actorSetFrame,
    actorSetFlip,
    sprites,
  } = helpers;
  const actor = getActorById(input.actorId);

  actorSetActive(input.actorId);
  actorSetDirection(input.direction);

  if (actor && actor.movementType === "static") {
    const spriteSheet = getSprite(actor.spriteSheetId, sprites);
    const numFrames = spriteSheet ? spriteSheet.numFrames : 0;
    const isActorSheet = numFrames === 3 || numFrames === 6;
    if (isActorSheet) {
      const frame = directionToFrame(input.direction, numFrames);
      const flip = input.direction === "left";
      actorSetFrame(frame);
      actorSetFlip(flip);
    }
  }
};

module.exports = {
  id,
  fields,
  compile
};

export const key = "EVENT_ACTOR_SET_DIRECTION";

export const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "player"
  },
  {
    key: "direction",
    type: "direction",
    defaultValue: "up"
  }
];

export const compile = (input, options) => {
  const { output = [], scene, sprites } = options;

  const actor = getActor(input.args.actorId, scene);
  const actorIndex = getActorIndex(input.args.actorId, scene);
  output.push(CMD_LOOKUP.ACTOR_SET_ACTIVE);
  output.push(actorIndex);
  output.push(CMD_LOOKUP.ACTOR_SET_DIRECTION);
  output.push(dirDec(input.args.direction));
  // If direction event applied to static actor
  // calculate frame offset and apply that instead
  if (actor && actor.movementType === "static") {
    const spriteSheet = getSprite(actor.spriteSheetId, sprites);
    if (
      spriteSheet &&
      (spriteSheet.numFrames === 3 || spriteSheet.numFrames === 6)
    ) {
      output.push(CMD_LOOKUP.ACTOR_SET_FRAME);
      output.push(
        directionToFrame(input.args.direction, spriteSheet.numFrames)
      );
      const flip = input.args.direction === "left";
      output.push(CMD_LOOKUP.ACTOR_SET_FLIP);
      output.push(flip);
    }
  }
};

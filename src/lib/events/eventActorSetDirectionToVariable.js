import { getActor, getSprite } from "./helpers";
import { directionToFrame } from "../helpers/gbstudio";

export const id = "EVENT_ACTOR_SET_DIRECTION_TO_VALUE";

export const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "player"
  },
  {
    key: "variable",
    type: "variable",
    defaultValue: "LAST_VARIABLE"
  }
];

export const compile = (input, helpers) => {
  const { actorSetActive, ifVariableValue } = helpers;

  actorSetActive(input.actorId);

  ifVariableValue(
    input.variable,
    "==",
    1,
    () => {
      changeDirection("down", input, helpers);
    },
    () => {
      ifVariableValue(
        input.variable,
        "==",
        2,
        () => {
          changeDirection("left", input, helpers);
        },
        () => {
          ifVariableValue(
            input.variable,
            "==",
            4,
            () => {
              changeDirection("right", input, helpers);
            },
            () => {
              changeDirection("up", input, helpers);
            }
          );
        }
      );
    }
  );
};

function changeDirection(direction, input, helpers) {
  const {
    actorSetDirection,
    actorSetFrame,
    actorSetFlip,
    sprites,
    scene
  } = helpers;

  const actor = getActor(input.actorId, scene);

  actorSetDirection(direction);

  if (actor && actor.movementType === "static") {
    const spriteSheet = getSprite(actor.spriteSheetId, sprites);
    const numFrames = spriteSheet ? spriteSheet.numFrames : 0;
    const isActorSheet = numFrames === 3 || numFrames === 6;
    if (isActorSheet) {
      const frame = directionToFrame(direction, numFrames);
      const flip = direction === "left";
      actorSetFrame(frame);
      actorSetFlip(flip);
    }
  }
}

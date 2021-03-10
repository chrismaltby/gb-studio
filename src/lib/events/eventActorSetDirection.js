const getSprite = require("./helpers").getSprite;
const directionToFrame = require("../helpers/gbstudio").directionToFrame;

const id = "EVENT_ACTOR_SET_DIRECTION";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "direction",
    type: "union",
    types: ["direction", "variable", "property"],
    defaultType: "direction",
    defaultValue: {
      direction: "up",
      variable: "LAST_VARIABLE",
      property: "$self$:direction",
    },
  },
];

const compile = (input, helpers) => {
  const {
    actorSetActive,
    actorSetDirection,
    ifVariableValue,
    variableFromUnion,
    temporaryEntityVariable,
  } = helpers;

  actorSetActive(input.actorId);

  if (input.direction.type === "direction") {
    actorSetDirection(input.direction.value);

    // changeDirection(input.direction.value, input, helpers)
  } else if (typeof input.direction === "string") {
    // changeDirection(input.direction, input, helpers)
  } else {
    // const dirVar = variableFromUnion(input.direction, temporaryEntityVariable(0));
    // ifVariableValue(
    //   dirVar,
    //   "==",
    //   1,
    //   () => {
    //     changeDirection("down", input, helpers);
    //   },
    //   () => {
    //     ifVariableValue(
    //       dirVar,
    //       "==",
    //       2,
    //       () => {
    //         changeDirection("left", input, helpers);
    //       },
    //       () => {
    //         ifVariableValue(
    //           dirVar,
    //           "==",
    //           4,
    //           () => {
    //             changeDirection("right", input, helpers);
    //           },
    //           () => {
    //             changeDirection("up", input, helpers);
    //           }
    //         );
    //       }
    //     );
    //   }
    // );
  }
};

// function changeDirection(direction, input, helpers) {
//   const {
//     getActorById,
//     actorSetDirection,
//     actorSetFrame,
//     actorSetFlip,
//     sprites,
//   } = helpers;

//   const actor = getActorById(input.actorId);

//   actorSetDirection(direction);

//   if (actor && actor.spriteType === "static") {
//     const spriteSheet = getSprite(actor.spriteSheetId, sprites);
//     const numFrames = spriteSheet ? spriteSheet.numFrames : 0;
//     const isActorSheet = numFrames === 3 || numFrames === 6;
//     if (isActorSheet) {
//       const frame = directionToFrame(direction, numFrames);
//       const flip = direction === "left";
//       actorSetFrame(frame);
//       actorSetFlip(flip);
//     }
//   }
// }

module.exports = {
  id,
  fields,
  compile,
};

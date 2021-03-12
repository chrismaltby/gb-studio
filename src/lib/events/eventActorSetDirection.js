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

module.exports = {
  id,
  fields,
  compile,
  allowedBeforeInitFade: true,
};

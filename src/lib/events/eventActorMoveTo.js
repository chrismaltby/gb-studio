const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_MOVE_TO";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "x",
    label: l10n("FIELD_X"),
    type: "union",
    types: ["number", "variable", "property"],
    defaultType: "number",
    min: 0,
    max: 255,
    width: "50%",
    defaultValue: {
      number: 0,
      variable: "LAST_VARIABLE",
      property: "$self$:xpos"
    },
  },
  {
    key: "y",
    label: l10n("FIELD_Y"),
    type: "union",
    types: ["number", "variable", "property"],
    defaultType: "number",
    min: 0,
    max: 255,
    width: "50%",
    defaultValue: {
      number: 0,
      variable: "LAST_VARIABLE",
      property: "$self$:xpos"
    },   
  },
  {
    key: "moveType",
    label: l10n("FIELD_MOVEMENT_TYPE"),
    type: "select",
    options: [
      ["horizontal", "↔ " + l10n("FIELD_HORIZONTAL_FIRST")],
      ["vertical", "↕ " + l10n("FIELD_VERTICAL_FIRST")],
      ["diagonal", "⤡ " + l10n("FIELD_DIAGONAL")]
    ],
    defaultValue: "horizontal",
    width: "50%",
  },    
  {
    key: "useCollisions",
    label: l10n("FIELD_USE_COLLISIONS"),
    width: "50%",
    alignCheckbox: true,
    type: "checkbox",
    defaultValue: false
  }
];

const compile = (input, helpers) => {
  const { actorSetActive, actorMoveTo, actorMoveToVariables, variableFromUnion, temporaryEntityVariable } = helpers;

  actorSetActive(input.actorId);
  
  if(input.x.type === "number" && input.y.type === "number") {
    // If all inputs are numbers use fixed implementation
    actorMoveTo(input.x.value, input.y.value, input.useCollisions, input.moveType);
  } else {
    // If any value is not a number transfer values into variables and use variable implementation
    const xVar = variableFromUnion(input.x, temporaryEntityVariable(0));
    const yVar = variableFromUnion(input.y, temporaryEntityVariable(1));
    actorMoveToVariables(xVar, yVar, input.useCollisions, input.moveType);
  }
};

module.exports = {
  id,
  fields,
  compile
};

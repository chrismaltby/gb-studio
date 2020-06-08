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
    key: "useCollisions",
    label: l10n("FIELD_USE_COLLISIONS"),
    width: "50%",
    type: "checkbox",
    defaultValue: false
  },
  {
    key: "verticalFirst",
    label: l10n("FIELD_VERTICAL_FIRST"),
    width: "50%",
    type: "checkbox",
    defaultValue: false
  } 
];

const compile = (input, helpers) => {
  const { actorSetActive, actorMoveTo, actorMoveToVariables, variableFromUnion } = helpers;

  actorSetActive(input.actorId);
  
  if(input.x.type === "number" && input.y.type === "number") {
    // If all inputs are numbers use fixed implementation
    actorMoveTo(input.x.value, input.y.value, input.useCollisions, input.verticalFirst);
  } else {
    // If any value is not a number transfer values into variables and use variable implementation
    const xVar = variableFromUnion(input.x, "tmp1");
    const yVar = variableFromUnion(input.y, "tmp2");
    actorMoveToVariables(xVar, yVar, input.useCollisions, input.verticalFirst);
  }
};

module.exports = {
  id,
  fields,
  compile
};

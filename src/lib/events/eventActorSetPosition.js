const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_SET_POSITION";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$"
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
];

const compile = (input, helpers) => {
  const { actorSetActive, actorSetPosition, actorSetPositionToVariables, variableFromUnion } = helpers;
  actorSetActive(input.actorId);
  if(input.x.type === "number" && input.y.type === "number") {
    // If all inputs are numbers use fixed implementation
    actorSetPosition(input.x.value, input.y.value);
  } else {
    // If any value is not a number transfer values into variables and use variable implementation
    const xVar = variableFromUnion(input.x, "tmp1");
    const yVar = variableFromUnion(input.y, "tmp2");
    actorSetPositionToVariables(xVar, yVar);
  }
};

module.exports = {
  id,
  fields,
  compile
};

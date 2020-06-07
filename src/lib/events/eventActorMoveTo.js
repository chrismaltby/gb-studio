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
  const { actorSetActive, actorMoveTo, actorMoveToVariables, variableSetToValue, variableSetToProperty } = helpers;
  const tmp1 = "tmp1";
  const tmp2 = "tmp2";

  actorSetActive(input.actorId);

  if(input.x.type === "number" && input.y.type === "number") {
    actorMoveTo(input.x.value, input.y.value, input.useCollisions, input.verticalFirst);
  } else {
    let xVar = input.x.value;
    let yVar = input.y.value;
    
    if(input.x.type === "number"){
      variableSetToValue(tmp1, input.x.value);
      xVar = tmp1;
    } else if(input.x.type === "property"){
      variableSetToProperty(tmp1, input.x.value);
      xVar = tmp1;
    }

    if(input.y.type === "number"){
      variableSetToValue(tmp2, input.y.value);
      yVar = tmp2;
    } else if(input.y.type === "property"){
      variableSetToProperty(tmp2, input.y.value);
      yVar = tmp2;
    }

    actorMoveToVariables(xVar, yVar, input.useCollisions, input.verticalFirst);
  }
};

module.exports = {
  id,
  fields,
  compile
};

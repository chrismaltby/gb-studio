const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_MOVE_TO";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "player",
  },
  {
    key: "x",
    label: l10n("FIELD_X"),
    type: "union",
    types: ["number", "variable", "property"],
    min: 0,
    max: 255,
    width: "50%",
    defaultValue: {
      type: "number",
      number: 0,
      variable: "LAST_VARIABLE"
    },
  },
  {
    key: "y",
    label: l10n("FIELD_Y"),
    type: "union",
    types: ["number", "variable", "property"],
    min: 0,
    max: 255,
    width: "50%",
    defaultValue: {
      type: "number",
      number: 0,
      variable: "LAST_VARIABLE"
    },   
  }
];

const compile = (input, helpers) => {
  const { actorSetActive, actorMoveTo, actorMoveToVariables, variableSetToValue } = helpers;
  const tmp1 = "tmp1";
  const tmp2 = "tmp2";

  actorSetActive(input.actorId);

  if(input.x.type === "number" && input.y.type === "number") {
    actorMoveTo(input.x.value, input.y.value);
  } else {
    let xVar = input.x.value;
    let yVar = input.y.value;
    if(input.x.type === "number"){
      variableSetToValue(tmp1, input.x.value);
      xVar = tmp1;
    }
    if(input.y.type === "number"){
      variableSetToValue(tmp2, input.y.value);
      yVar = tmp2;
    }    
    actorMoveToVariables(xVar, yVar);
  }
};

module.exports = {
  id,
  fields,
  compile
};

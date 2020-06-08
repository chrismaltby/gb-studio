const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_SET_FRAME";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "LAST_ACTOR"
  },
  {
    key: "frame",
    label: l10n("FIELD_ANIMATION_FRAME"),
    type: "union",
    types: ["number", "variable", "property"],
    defaultType: "number",
    min: 0,
    max: 25,
    defaultValue: {
      number: 0,
      variable: "LAST_VARIABLE",
      property: "$self$:frame"
    },
  },

];

const compile = (input, helpers) => {
  const { actorSetActive, actorSetFrame, actorSetFrameToVariable, variableFromUnion } = helpers;
  actorSetActive(input.actorId);
  if(input.frame.type === "number") {
    actorSetFrame(input.frame.value);
  } else {
    const frameVar = variableFromUnion(input.frame, "tmp1");
    actorSetFrameToVariable(frameVar);
  }
};

module.exports = {
  id,
  fields,
  compile
};

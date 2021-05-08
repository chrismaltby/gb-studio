const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_SET_FRAME";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$",
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
      property: "$self$:frame",
    },
  },
];

const compile = (input, helpers) => {
  const {
    actorSetActive,
    actorSetFrame,
    actorSetFrameToVariable,
    variableFromUnion,
    temporaryEntityVariable,
  } = helpers;
  if (input.frame.type === "number") {
    actorSetActive(input.actorId);
    actorSetFrame(input.frame.value);
  } else {
    const frameVar = variableFromUnion(input.frame, temporaryEntityVariable(0));
    actorSetActive(input.actorId);
    actorSetFrameToVariable(frameVar);
  }
};

module.exports = {
  id,
  fields,
  compile,
  allowedBeforeInitFade: true,
};

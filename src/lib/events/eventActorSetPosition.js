const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_SET_POSITION";
const groups = ["EVENT_GROUP_ACTOR"];

const autoLabel = (fetchArg, input) => {
  const unitPostfix =
    input.units === "pixels" ? l10n("FIELD_PIXELS_SHORT") : "";
  return l10n("EVENT_ACTOR_SET_POSITION_LABEL", {
    actor: fetchArg("actorId"),
    x: `${fetchArg("x")}${unitPostfix}`,
    y: `${fetchArg("y")}${unitPostfix}`,
  });
};

const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    type: "actor",
    defaultValue: "$self$",
  },
  {
    type: "group",
    fields: [
      {
        key: "x",
        label: l10n("FIELD_X"),
        type: "union",
        types: ["number", "variable", "property"],
        defaultType: "number",
        min: 0,
        max: 255,
        width: "50%",
        unitsField: "units",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
        defaultValue: {
          number: 0,
          variable: "LAST_VARIABLE",
          property: "$self$:xpos",
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
        unitsField: "units",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
        defaultValue: {
          number: 0,
          variable: "LAST_VARIABLE",
          property: "$self$:ypos",
        },
      },
    ],
  },
];

const compile = (input, helpers) => {
  const {
    actorSetActive,
    actorSetPosition,
    actorSetPositionToVariables,
    variableFromUnion,
    temporaryEntityVariable,
  } = helpers;
  actorSetActive(input.actorId);
  if (input.x.type === "number" && input.y.type === "number") {
    // If all inputs are numbers use fixed implementation
    actorSetPosition(input.x.value, input.y.value, input.units);
  } else {
    // If any value is not a number transfer values into variables and use variable implementation
    const xVar = variableFromUnion(input.x, temporaryEntityVariable(0));
    const yVar = variableFromUnion(input.y, temporaryEntityVariable(1));
    actorSetPositionToVariables(xVar, yVar, input.units);
  }
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};

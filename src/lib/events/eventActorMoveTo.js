const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_MOVE_TO";
const groups = ["EVENT_GROUP_ACTOR"];
const weight = 2;

const autoLabel = (fetchArg, input) => {
  const unitPostfix =
    input.units === "pixels" ? l10n("FIELD_PIXELS_SHORT") : "";
  return l10n("EVENT_ACTOR_MOVE_TO_LABEL", {
    actor: fetchArg("actorId"),
    x: `${fetchArg("x")}${unitPostfix}`,
    y: `${fetchArg("y")}${unitPostfix}`,
  });
};

const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description: l10n("FIELD_ACTOR_MOVE_DESC"),
    type: "actor",
    defaultValue: "$self$",
  },
  {
    type: "group",
    fields: [
      {
        key: "x",
        label: l10n("FIELD_X"),
        description: l10n("FIELD_X_DESC"),
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
        description: l10n("FIELD_Y_DESC"),
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
  {
    key: "moveType",
    label: l10n("FIELD_MOVE_TYPE"),
    description: l10n("FIELD_MOVE_TYPE_DESC"),
    hideLabel: true,
    type: "moveType",
    defaultValue: "horizontal",
    flexBasis: 30,
    flexGrow: 0,
  },
  {
    key: "useCollisions",
    label: l10n("FIELD_USE_COLLISIONS"),
    description: l10n("FIELD_USE_COLLISIONS_DESC"),
    width: "50%",
    alignCheckbox: true,
    type: "checkbox",
    defaultValue: false,
  },
];

const compile = (input, helpers) => {
  const {
    actorSetActive,
    actorMoveTo,
    actorMoveToVariables,
    variableFromUnion,
    temporaryEntityVariable,
  } = helpers;
  if (input.x.type === "number" && input.y.type === "number") {
    // If all inputs are numbers use fixed implementation
    actorSetActive(input.actorId);
    actorMoveTo(
      input.x.value,
      input.y.value,
      input.useCollisions,
      input.moveType,
      input.units
    );
  } else {
    // If any value is not a number transfer values into variables and use variable implementation
    const xVar = variableFromUnion(input.x, temporaryEntityVariable(0));
    const yVar = variableFromUnion(input.y, temporaryEntityVariable(1));
    actorSetActive(input.actorId);
    actorMoveToVariables(
      xVar,
      yVar,
      input.useCollisions,
      input.moveType,
      input.units
    );
  }
};

module.exports = {
  id,
  description: l10n("EVENT_ACTOR_MOVE_TO_DESC"),
  autoLabel,
  groups,
  weight,
  fields,
  compile,
  waitUntilAfterInitFade: true,
  helper: {
    type: "position",
    x: "x",
    y: "y",
    units: "units",
    tileWidth: 2,
  },
};

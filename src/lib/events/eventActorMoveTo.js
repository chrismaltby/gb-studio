const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_MOVE_TO";
const groups = ["EVENT_GROUP_ACTOR"];
const weight = 2;

const autoLabel = (fetchArg, input) => {
  if (input.units === "pixels") {
    return l10n("EVENT_ACTOR_MOVE_TO_LABEL", {
      actor: fetchArg("actorId"),
      units: l10n("FIELD_PIXELS"),
      x: fetchArg("px"),
      y: fetchArg("py"),
    });
  }
  return l10n("EVENT_ACTOR_MOVE_TO_LABEL", {
    actor: fetchArg("actorId"),
    units: l10n("FIELD_TILES"),
    x: fetchArg("x"),
    y: fetchArg("y"),
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
    key: "units",
    type: "select",
    options: [
      ["tiles", l10n("FIELD_TILES")],
      ["pixels", l10n("FIELD_PIXELS")],
    ],
    defaultValue: "tiles",
  },
  {
    type: "group",
    conditions: [
      {
        key: "units",
        eq: "tiles",
      },
    ],
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
        defaultValue: {
          number: 0,
          variable: "LAST_VARIABLE",
          property: "$self$:xpos",
        },
      },
    ],
  },
  {
    type: "group",
    conditions: [
      {
        key: "units",
        eq: "pixels",
      },
    ],
    fields: [
      {
        key: "px",
        label: l10n("FIELD_X"),
        type: "union",
        types: ["number", "variable", "property"],
        defaultType: "number",
        min: 0,
        max: 2040,
        width: "50%",
        defaultValue: {
          number: 0,
          variable: "LAST_VARIABLE",
          property: "$self$:xpos",
        },
      },
      {
        key: "py",
        label: l10n("FIELD_Y"),
        type: "union",
        types: ["number", "variable", "property"],
        defaultType: "number",
        min: 0,
        max: 2040,
        width: "50%",
        defaultValue: {
          number: 0,
          variable: "LAST_VARIABLE",
          property: "$self$:xpos",
        },
      },
    ],
  },
  {
    key: "moveType",
    label: l10n("FIELD_MOVEMENT_TYPE"),
    type: "select",
    options: [
      ["horizontal", "↔ " + l10n("FIELD_HORIZONTAL_FIRST")],
      ["vertical", "↕ " + l10n("FIELD_VERTICAL_FIRST")],
      ["diagonal", "⤡ " + l10n("FIELD_DIAGONAL")],
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

  if (input.units === "tiles") {
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
      actorMoveToVariables(xVar, yVar, input.useCollisions, input.moveType, input.units);
    }
  } else {
    if (input.px.type === "number" && input.py.type === "number") {
      // If all inputs are numbers use fixed implementation
      actorSetActive(input.actorId);
      actorMoveTo(
        input.px.value,
        input.py.value,
        input.useCollisions,
        input.moveType,
        input.units
      );
    } else {
      // If any value is not a number transfer values into variables and use variable implementation
      const xVar = variableFromUnion(input.px, temporaryEntityVariable(0));
      const yVar = variableFromUnion(input.py, temporaryEntityVariable(1));
      actorSetActive(input.actorId);
      actorMoveToVariables(xVar, yVar, input.useCollisions, input.moveType, input.units);
    }
  }
};

module.exports = {
  id,
  autoLabel,
  groups,
  weight,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};

const l10n = require("../helpers/l10n").default;

const id = "EVENT_REPLACE_TILE_XY_SEQUENCE";
const groups = ["EVENT_GROUP_SCENE"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_REPLACE_TILE_XY_SEQUENCE_LABEL", {
    x: `${fetchArg("x")}`,
    y: `${fetchArg("y")}`,
  });
};

const fields = [
  {
    type: "group",
    fields: [
      {
        key: "x",
        label: l10n("FIELD_X"),
        description: l10n("FIELD_X_DESC"),
        type: "number",
        min: 0,
        max: 255,
        width: "50%",
        defaultValue: 0,
      },
      {
        key: "y",
        label: l10n("FIELD_Y"),
        description: l10n("FIELD_Y_DESC"),
        type: "number",
        min: 0,
        max: 255,
        width: "50%",
        defaultValue: 0,
      },
    ],
  },
  {
    key: "tilesetId",
    type: "tileset",
    label: l10n("FIELD_TILESET"),
    description: l10n("FIELD_TILESET_DESC"),
    defaultValue: "LAST_TILESET",
    unitsField: "tileSize",
    unitsDefault: "8px",
    unitsAllowed: ["8px", "16px"],
  },
  {
    type: "group",
    fields: [
      {
        key: "tileIndex",
        label: l10n("FIELD_FROM_TILE"),
        description: l10n("FIELD_FROM_TILE_DESC"),
        type: "union",
        types: ["number", "variable", "property"],
        defaultType: "number",
        min: 0,
        width: "50%",
        defaultValue: {
          number: 0,
          variable: "LAST_VARIABLE",
          property: "$self$:xpos",
        },
      },
      {
        key: "frames",
        label: l10n("FIELD_ANIMATION_FRAMES"),
        description: l10n("FIELD_ANIMATION_FRAMES_DESC"),
        type: "union",
        types: ["number", "variable", "property"],
        defaultType: "number",
        min: 1,
        width: "50%",
        defaultValue: {
          number: 1,
          variable: "LAST_VARIABLE",
          property: "$self$:xpos",
        },
      },
    ],
  },
  {
    key: "variable",
    label: l10n("FIELD_STATE_VARIABLE"),
    description: l10n("FIELD_STATE_VARIABLE_DESC"),
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
];

const compile = (input, helpers) => {
  const {
    replaceTileXYVariable,
    localVariableFromUnion,
    ifVariableCompare,
    variableInc,
    variableAdd,
    variableSetToUnionValue,
    markLocalsUsed,
    _declareLocal,
    _rpn,
    _addComment,
    _addNL,
  } = helpers;

  const fromVar = localVariableFromUnion(input.tileIndex);
  const framesVar = localVariableFromUnion(input.frames);
  const toVar = _declareLocal("to_var", 1, true);

  // Calculate max frame
  _addComment("Calculate max frame");
  if (input.tileSize === "16px") {
    _rpn() //
      .refVariable(fromVar)
      .refVariable(framesVar)
      .int8(1)
      .operator(".SUB")
      .int8(2)
      .operator(".MUL")
      .operator(".ADD")
      .refSet(toVar)
      .stop();
  } else {
    _rpn() //
      .refVariable(fromVar)
      .refVariable(framesVar)
      .int8(1)
      .operator(".SUB")
      .operator(".ADD")
      .refSet(toVar)
      .stop();
  }
  _addNL();

  ifVariableCompare(input.variable, ".LT", fromVar, () => {
    variableSetToUnionValue(input.variable, input.tileIndex);
  });

  replaceTileXYVariable(
    input.x,
    input.y,
    input.tilesetId,
    input.variable,
    input.tileSize
  );

  if (input.tileSize === "16px") {
    variableAdd(input.variable, 2);
  } else {
    variableInc(input.variable);
  }

  ifVariableCompare(input.variable, ".GT", toVar, () => {
    variableSetToUnionValue(input.variable, input.tileIndex);
  });

  markLocalsUsed(fromVar, framesVar, toVar);
};

module.exports = {
  id,
  description: l10n("EVENT_REPLACE_TILE_XY_SEQUENCE_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
  helper: {
    type: "position",
    x: "x",
    y: "y",
    tileSize: "tileSize",
  },
};

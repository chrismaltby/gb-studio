const l10n = require("../helpers/l10n").default;

const id = "EVENT_REPLACE_TILE_XY_SEQUENCE";
const groups = ["EVENT_GROUP_SCENE"];
const subGroups = {
  EVENT_GROUP_SCENE: "EVENT_GROUP_TILES",
};

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
        type: "value",
        min: 0,
        max: 255,
        width: "50%",
        defaultValue: {
          type: "number",
          value: 0,
        },
      },
      {
        key: "y",
        label: l10n("FIELD_Y"),
        description: l10n("FIELD_Y_DESC"),
        type: "value",
        min: 0,
        max: 255,
        width: "50%",
        defaultValue: {
          type: "number",
          value: 0,
        },
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
        type: "value",
        min: 0,
        width: "50%",
        defaultValue: {
          type: "number",
          value: 0,
        },
      },
      {
        key: "frames",
        label: l10n("FIELD_ANIMATION_FRAMES"),
        description: l10n("FIELD_ANIMATION_FRAMES_DESC"),
        type: "value",
        min: 1,
        width: "50%",
        defaultValue: {
          type: "number",
          value: 1,
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
    replaceTileXYScriptValue,
    ifVariableCompare,
    ifVariableCompareScriptValue,
    variableInc,
    variableAdd,
    variableSetToScriptValue,
    _declareLocal,
    _addComment,
    _addNL,
    markLocalsUsed,
  } = helpers;

  const toVar = _declareLocal("to_var", 1, true);

  // Calculate max frame
  _addComment("Calculate max frame");
  if (input.tileSize === "16px") {
    variableSetToScriptValue(toVar, {
      type: "add",
      valueA: input.tileIndex,
      valueB: {
        type: "mul",
        valueA: {
          type: "sub",
          valueA: input.frames,
          valueB: {
            type: "number",
            value: 1,
          },
        },
        valueB: {
          type: "number",
          value: 2,
        },
      },
    });
  } else {
    variableSetToScriptValue(toVar, {
      type: "add",
      valueA: input.tileIndex,
      valueB: {
        type: "sub",
        valueA: input.frames,
        valueB: {
          type: "number",
          value: 1,
        },
      },
    });
  }
  _addNL();

  ifVariableCompareScriptValue(input.variable, ".LT", input.tileIndex, () => {
    variableSetToScriptValue(input.variable, input.tileIndex);
  });

  replaceTileXYScriptValue(
    input.x,
    input.y,
    input.tilesetId,
    {
      type: "variable",
      value: input.variable,
    },
    input.tileSize,
  );

  if (input.tileSize === "16px") {
    variableAdd(input.variable, 2);
  } else {
    variableInc(input.variable);
  }

  ifVariableCompare(input.variable, ".GT", toVar, () => {
    variableSetToScriptValue(input.variable, input.tileIndex);
  });

  markLocalsUsed(toVar);
};

module.exports = {
  id,
  description: l10n("EVENT_REPLACE_TILE_XY_SEQUENCE_DESC"),
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
  helper: {
    type: "position",
    x: "x",
    y: "y",
    tileSize: "tileSize",
  },
};

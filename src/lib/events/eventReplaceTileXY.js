const l10n = require("../helpers/l10n").default;

const id = "EVENT_REPLACE_TILE_XY";
const groups = ["EVENT_GROUP_SCENE"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_REPLACE_TILE_XY_LABEL", {
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
  },
  {
    key: "tileIndex",
    label: l10n("FIELD_TILE"),
    description: l10n("FIELD_TILE_DESC"),
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
];

const compile = (input, helpers) => {
  const {
    replaceTileXY,
    replaceTileXYVariable,
    localVariableFromUnion,
    markLocalsUsed,
  } = helpers;
  if (input.tileIndex.type === "number") {
    replaceTileXY(input.x, input.y, input.tilesetId, input.tileIndex.value);
  } else {
    const indexVar = localVariableFromUnion(input.tileIndex);
    replaceTileXYVariable(input.x, input.y, input.tilesetId, indexVar);
    markLocalsUsed(indexVar);
  }
};

module.exports = {
  id,
  description: l10n("EVENT_REPLACE_TILE_XY_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
  helper: {
    type: "position",
    x: "x",
    y: "y",
  },
};

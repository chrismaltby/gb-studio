const l10n = require("../helpers/l10n").default;

const id = "EVENT_REPLACE_TILE_XY";
const groups = ["EVENT_GROUP_SCENE"];
const subGroups = {
  EVENT_GROUP_SCENE: "EVENT_GROUP_TILES",
};

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
    type: "group",
    fields: [
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
        key: "tileIndex",
        label: l10n("FIELD_TILE"),
        description: l10n("FIELD_TILE_DESC"),
        type: "value",
        min: 0,
        defaultValue: {
          type: "number",
          value: 0,
        },
      },
    ],
  },
];

const compile = (input, helpers) => {
  const { replaceTileXYScriptValue } = helpers;
  replaceTileXYScriptValue(
    input.x,
    input.y,
    input.tilesetId,
    input.tileIndex,
    input.tileSize
  );
};

module.exports = {
  id,
  description: l10n("EVENT_REPLACE_TILE_XY_DESC"),
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

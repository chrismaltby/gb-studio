const l10n = require("../helpers/l10n").default;

const id = "EVENT_REPLACE_BACKGROUND_TILE";
const groups = ["EVENT_GROUP_SCENE"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_REPLACE_BACKGROUND_TILE_LABEL", {
    x: fetchArg("x"),
    y: fetchArg("y"),
    index: fetchArg("tileIndex"),
    scene: fetchArg("sceneId"),
  });
};

const fields = [
  {
  	label: l10n("FIELD_REPLACE_TILE_AT"),
  },
  {
  	label: l10n("FIELD_REPLACE_TILE_WARNING"),
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
          property: "$self$:ypos",
        },
      },
    ],
  },
  {
    key: "sceneId",
    label: l10n("FIELD_TILESET"),
    type: "scene",
    defaultValue: "LAST_SCENE",
  },
  {
    key: "tileIndex",
    label: l10n("FIELD_TILE_INDEX"),
    type: "union",
    types: ["number", "variable", "property"],
    defaultType: "number",
    min: 0,
    max: 255,
    width: "50%",
    defaultValue: {
      number: 0,
      variable: "LAST_VARIABLE",
      property: "$self$:ypos",
     },
  },
];

const compile = (input, helpers) => {
  const { replaceBackgroundTile, replaceBackgroundTileVariables, variableFromUnion, temporaryEntityVariable } = helpers;
  if (input.x.type === "number" && input.y.type === "number" && input.tileIndex.type === "number") {
    replaceBackgroundTile(input.x.value, input.y.value, input.sceneId, input.tileIndex.value);
  } else {
    const xVar = variableFromUnion(input.x, temporaryEntityVariable(0));
    const yVar = variableFromUnion(input.y, temporaryEntityVariable(1));
    const tileVar = variableFromUnion(input.tileIndex, temporaryEntityVariable(2));
    replaceBackgroundTileVariables(xVar, yVar, input.sceneId, tileVar);
  }
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};

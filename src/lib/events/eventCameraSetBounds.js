const l10n = require("../helpers/l10n").default;

const id = "EVENT_CAMERA_SET_BOUNDS";
const groups = ["EVENT_GROUP_CAMERA"];

const autoLabel = (fetchArg, input) => {
  const unitPostfix =
    input.units === "pixels" ? l10n("FIELD_PIXELS_SHORT") : "";
  return l10n("EVENT_CAMERA_SET_BOUNDS_LABEL", {
    x: `${fetchArg("x")}${unitPostfix}`,
    y: `${fetchArg("y")}${unitPostfix}`,
    width: `${fetchArg("width")}${unitPostfix}`,
    height: `${fetchArg("height")}${unitPostfix}`,
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
        max: 2040,
        width: "50%",
        unitsField: "units",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
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
        max: 2040,
        width: "50%",
        unitsField: "units",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
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
        key: "width",
        label: l10n("FIELD_WIDTH"),
        description: l10n("FIELD_BOX_WIDTH_DESC"),
        type: "value",
        min: 20,
        max: 2040,
        width: "50%",
        unitsField: "units",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
        defaultValue: {
          type: "number",
          value: 0,
        },
      },
      {
        key: "height",
        label: l10n("FIELD_HEIGHT"),
        description: l10n("FIELD_BOX_HEIGHT_DESC"),
        type: "value",
        min: 18,
        max: 2040,
        width: "50%",
        unitsField: "units",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
        defaultValue: {
          type: "number",
          value: 0,
        },
      },
    ],
  },
];

const compile = (input, helpers) => {
  const { cameraSetBoundsToScriptValues } = helpers;
  cameraSetBoundsToScriptValues(
    input.x,
    input.y,
    input.width,
    input.height,
    input.units,
  );
};

module.exports = {
  id,
  description: l10n("EVENT_CAMERA_SET_BOUNDS_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
  helper: {
    type: "camera",
    x: "x",
    y: "y",
    width: "width",
    height: "height",
    units: "units",
  },
};

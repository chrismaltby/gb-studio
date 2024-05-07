const l10n = require("../helpers/l10n").default;

const id = "EVENT_CAMERA_SET_POSITION";
const groups = ["EVENT_GROUP_CAMERA"];

const autoLabel = (fetchArg, input) => {
  const unitPostfix =
    input.units === "pixels" ? l10n("FIELD_PIXELS_SHORT") : "";
  return l10n("EVENT_CAMERA_SET_POSITION_LABEL", {
    x: `${fetchArg("x")}${unitPostfix}`,
    y: `${fetchArg("y")}${unitPostfix}`,
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
        max: 2047,
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
        max: 2047,
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
  const { cameraMoveToScriptValues } = helpers;
  cameraMoveToScriptValues(input.x, input.y, 0, input.units);
};

module.exports = {
  id,
  description: l10n("EVENT_CAMERA_MOVE_TO_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: false,
  helper: {
    type: "camera",
    x: "x",
    y: "y",
    units: "units",
  },
};

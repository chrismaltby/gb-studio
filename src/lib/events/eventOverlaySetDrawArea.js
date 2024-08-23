const l10n = require("../helpers/l10n").default;

const id = "EVENT_OVERLAY_SET_DRAW_AREA";
const groups = ["EVENT_GROUP_SCREEN"];
const subGroups = {
  EVENT_GROUP_SCREEN: "EVENT_GROUP_OVERLAY",
};

const fields = [
  {
    key: "height",
    label: l10n("FIELD_HEIGHT"),
    description: l10n("FIELD_OVERLAY_DRAW_HEIGHT_DESC"),
    type: "value",
    min: 0,
    max: 150,
    unitsField: "units",
    unitsDefault: "tiles",
    unitsAllowed: ["tiles", "pixels"],
    defaultValue: {
      type: "number",
      value: 150,
    },
  },
];

const compile = (input, helpers) => {
  const { overlaySetDrawArea } = helpers;
  overlaySetDrawArea(input.height, input.units);
};

module.exports = {
  id,
  description: l10n("EVENT_OVERLAY_SET_DRAW_AREA_DESC"),
  groups,
  subGroups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};

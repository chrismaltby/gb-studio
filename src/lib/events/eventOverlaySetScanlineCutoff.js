const l10n = require("../helpers/l10n").default;

const id = "EVENT_OVERLAY_SET_SCANLINE_CUTOFF";
const groups = ["EVENT_GROUP_SCREEN"];
const subGroups = {
  EVENT_GROUP_SCREEN: "EVENT_GROUP_OVERLAY",
};

const fields = [
  {
    key: "y",
    label: l10n("FIELD_OVERLAY_SCANLINE_CUTOFF_Y"),
    description: l10n("FIELD_OVERLAY_SCANLINE_CUTOFF_Y_DESC"),
    type: "value",
    min: 0,
    max: 150,
    unitsField: "units",
    unitsDefault: "pixels",
    unitsAllowed: ["pixels"],
    defaultValue: {
      type: "number",
      value: 150,
    },
  },
  {
    label: l10n("FIELD_OVERLAY_SET_SCANLINE_CUTOFF_LABEL"),
    flexBasis: "100%",
  },
];

const compile = (input, helpers) => {
  const { overlaySetScanlineCutoff } = helpers;
  overlaySetScanlineCutoff(input.y, input.units);
};

module.exports = {
  id,
  description: l10n("EVENT_OVERLAY_SET_SCANLINE_CUTOFF_DESC"),
  groups,
  subGroups,
  fields,
  compile,
  helper: {
    type: "scanline",
    y: "y",
    units: "units",
  },
};

const l10n = require("../helpers/l10n").default;

const id = "EVENT_SET_SGB_COLOR_AREA";
const groups = ["EVENT_GROUP_COLOR"];

const paletteOptions = [
  ["none", l10n("FIELD_NONE")],
  ["0", l10n("FIELD_SUPER_GB_PALETTE_N", { index: 1 })],
  ["1", l10n("FIELD_SUPER_GB_PALETTE_N", { index: 2 })],
  ["2", l10n("FIELD_SUPER_GB_PALETTE_N", { index: 3 })],
  ["3", l10n("FIELD_SUPER_GB_PALETTE_N", { index: 4 })],
];

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
        max: 19,
        defaultValue: 0,
        width: "50%",
        unitsField: "units",
        unitsDefault: "tiles",
      },
      {
        key: "y",
        label: l10n("FIELD_Y"),
        description: l10n("FIELD_Y_DESC"),
        type: "number",
        min: 0,
        max: 17,
        defaultValue: 0,
        width: "50%",
        unitsField: "units",
        unitsDefault: "tiles",
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
        type: "number",
        min: 1,
        max: 20,
        defaultValue: 4,
        width: "50%",
        unitsField: "units",
        unitsDefault: "tiles",
      },
      {
        key: "height",
        label: l10n("FIELD_HEIGHT"),
        description: l10n("FIELD_BOX_HEIGHT_DESC"),
        type: "number",
        min: 1,
        max: 18,
        defaultValue: 4,
        width: "50%",
        unitsField: "units",
        unitsDefault: "tiles",
      },
    ],
  },
  {
    key: "fill",
    label: l10n("FIELD_FILL_PALETTE"),
    description: l10n("FIELD_FILL_PALETTE_DESC"),
    type: "select",
    defaultValue: "none",
    options: paletteOptions,
  },
  {
    key: "border",
    label: l10n("FIELD_BORDER_PALETTE"),
    description: l10n("FIELD_BORDER_PALETTE_DESC"),
    type: "select",
    defaultValue: "none",
    options: paletteOptions,
  },
  {
    key: "outside",
    label: l10n("FIELD_OUTSIDE_PALETTE"),
    description: l10n("FIELD_OUTSIDE_PALETTE_DESC"),
    type: "select",
    defaultValue: "none",
    options: paletteOptions,
  },
];

const compile = (input, helpers) => {
  const { setSGBColorArea } = helpers;
  const { fill, border, outside, x, y, width, height } = input;

  setSGBColorArea(fill, border, outside, x, y, width, height);
};

module.exports = {
  id,
  description: l10n("EVENT_SET_SGB_COLOR_AREA_DESC"),
  groups,
  fields,
  allowBeforeInitFade: true,
  helper: {
    type: "area",
    x: "x",
    y: "y",
    width: "width",
    height: "height",
    fill: "fill",
    border: "border",
    outside: "outside",
  },
  compile,
};

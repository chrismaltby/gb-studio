const l10n = require("../helpers/l10n").default;

const id = "EVENT_PALETTE_SET_UI";
const groups = ["EVENT_GROUP_COLOR"];

const fields = [
  {
    key: "palette",
    label: l10n("FIELD_PALETTE"),
    description: l10n("FIELD_PALETTE_DESC"),
    type: "palette",
    defaultValue: "",
    paletteType: "ui",
  },
];

const compile = (input, helpers) => {
  const { paletteSetUI } = helpers;
  paletteSetUI(input.palette);
};

module.exports = {
  id,
  description: l10n("EVENT_PALETTE_SET_UI_DESC"),
  groups,
  fields,
  compile,
};

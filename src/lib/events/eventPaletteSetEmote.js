const l10n = require("../helpers/l10n").default;

const id = "EVENT_PALETTE_SET_EMOTE";
const groups = ["EVENT_GROUP_COLOR"];

const fields = [
  {
    key: "palette",
    label: l10n("FIELD_PALETTE"),
    description: l10n("FIELD_PALETTE_DESC"),
    type: "palette",
    defaultValue: "",
    paletteType: "emote",
  },
];

const compile = (input, helpers) => {
  const { paletteSetEmote } = helpers;
  paletteSetEmote(input.palette);
};

module.exports = {
  id,
  description: l10n("EVENT_PALETTE_SET_EMOTE_DESC"),
  groups,
  fields,
  compile,
};

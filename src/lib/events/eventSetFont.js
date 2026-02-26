const l10n = require("../helpers/l10n").default;

const id = "EVENT_SET_FONT";
const groups = ["EVENT_GROUP_DIALOGUE"];

const fields = [
  {
    key: "fontId",
    label: l10n("FIELD_FONT"),
    description: l10n("FIELD_FONT"),
    type: "font",
    defaultValue: "LAST_FONT",
  },
];

const compile = (input, helpers) => {
  const { setFont, _getFontIndex } = helpers;
  setFont(_getFontIndex(input.fontId));
};

module.exports = {
  id,
  description: l10n("EVENT_SET_FONT_DESC"),
  groups,
  fields,
  compile,
};

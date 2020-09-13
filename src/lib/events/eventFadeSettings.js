const l10n = require("../helpers/l10n").default;

const id = "EVENT_FADE_SETTINGS";

const fields = [
  {
    key: "style",
    type: "fadeStyle",
    label: l10n("FIELD_FADE_STYLE"),
    defaultValue: "white"
  }
];

const compile = (input, helpers) => {
  const { fadeSetSettings } = helpers;
  fadeSetSettings(input.style);
};

module.exports = {
  id,
  fields,
  compile
};

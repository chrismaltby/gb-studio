const l10n = require("../helpers/l10n").default;

const id = "EVENT_COMMENT";

const fields = [
  {
    key: "text",
    type: "textarea",
    maxPerLine: 50,
    placeholder: l10n("FIELD_TEXT_PLACEHOLDER"),
    multiple: false,
    defaultValue: ""
  }
];

const compile = (input, helpers) => {};

module.exports = {
  id,
  fields,
  compile
};

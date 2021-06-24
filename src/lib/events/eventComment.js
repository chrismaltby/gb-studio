const l10n = require("../helpers/l10n").default;

const id = "EVENT_COMMENT";
const groups = ["EVENT_GROUP_MISC"];

const fields = [
  {
    key: "text",
    type: "textarea",
    maxPerLine: 50,
    placeholder: l10n("FIELD_TEXT_PLACEHOLDER"),
    multiple: false,
    defaultValue: "",
  },
];

const compile = () => {};

module.exports = {
  id,
  groups,
  fields,
  compile,
  allowedBeforeInitFade: true,
};

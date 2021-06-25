const l10n = require("../helpers/l10n").default;

const id = "EVENT_GOTO_LABEL";

const fields = [
  {
    key: "label",
    label: l10n("FIELD_LABEL"),
    type: "text",
  },
];

const compile = (input, helpers) => {
  const { labelGoto } = helpers;
  labelGoto(input.label);
};

module.exports = {
  id,
  deprecated: true,
  fields,
  compile,
};

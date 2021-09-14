const l10n = require("../helpers/l10n").default;

const id = "EVENT_DEFINE_LABEL";

const fields = [
  {
    key: "label",
    label: l10n("FIELD_LABEL"),
    type: "text",
  },
];

const compile = (input, helpers) => {
  const { labelDefine } = helpers;
  labelDefine(input.label);
};

module.exports = {
  id,
  deprecated: true,
  fields,
  compile,
};

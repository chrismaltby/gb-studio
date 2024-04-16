const l10n = require("../helpers/l10n").default;

const id = "EVENT_SET_TRUE";
const groups = ["EVENT_GROUP_VARIABLES"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_SET_VALUE_LABEL", {
    variable: fetchArg("variable"),
    value: l10n("FIELD_TRUE"),
  });
};

const fields = [
  {
    key: "variable",
    label: l10n("FIELD_VARIABLE"),
    description: l10n("FIELD_VARIABLE_DESC"),
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
];

const compile = (input, helpers) => {
  const { variableSetToTrue } = helpers;
  variableSetToTrue(input.variable);
};

module.exports = {
  id,
  description: l10n("EVENT_SET_TRUE_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
  deprecated: true,
};

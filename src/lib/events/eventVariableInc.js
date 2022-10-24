const l10n = require("../helpers/l10n").default;

const id = "EVENT_INC_VALUE";
const groups = ["EVENT_GROUP_VARIABLES"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_INC_VALUE_LABEL", { variable: fetchArg("variable") });
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
  const { variableInc } = helpers;
  variableInc(input.variable);
};

module.exports = {
  id,
  description: l10n("EVENT_INC_VALUE_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
};

const l10n = require("../helpers/l10n").default;

const id = "EVENT_DEC_VALUE";
const groups = ["EVENT_GROUP_VARIABLES"];
const subGroups = {
  EVENT_GROUP_VARIABLES: "EVENT_GROUP_COUNTER",
};

const autoLabel = (fetchArg) => {
  return l10n("EVENT_DEC_VALUE_LABEL", { variable: fetchArg("variable") });
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
  const { variableDec } = helpers;
  variableDec(input.variable);
};

module.exports = {
  id,
  description: l10n("EVENT_DEC_VALUE_DESC"),
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
};

const l10n = require("../helpers/l10n").default;

const id = "EVENT_SET_VALUE";
const groups = ["EVENT_GROUP_VARIABLES"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_SET_VALUE_LABEL", {
    variable: fetchArg("variable"),
    value: fetchArg("value"),
  });
};

const fields = [
  {
    key: "variable",
    label: l10n("FIELD_VARIABLE"),
    description: l10n("FIELD_VARIABLE_DESC"),
    type: "variable",
    defaultValue: "LAST_VARIABLE",
    flexBasis: 0,
    minWidth: 150,
  },
  {
    key: "value",
    label: l10n("FIELD_VALUE"),
    description: l10n("FIELD_VALUE_SET_DESC"),
    type: "value",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
];

const compile = (input, helpers) => {
  const { variableSetToScriptValue } = helpers;
  variableSetToScriptValue(input.variable, input.value);
};

module.exports = {
  id,
  description: l10n("EVENT_SET_VALUE_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
};

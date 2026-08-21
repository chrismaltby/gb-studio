const l10n = require("../helpers/l10n").default;

const id = "EVENT_ARRAY_SET";
const groups = ["EVENT_GROUP_VARIABLES"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ARRAY_SET_LABEL", {
    array: fetchArg("array"),
  });
};

const fields = [
  {
    key: "array",
    label: l10n("FIELD_ARRAY"),
    description: l10n("FIELD_ARRAY_DESC"),
    type: "variable",
    variableType: "arrayReference",
    defaultValue: "LAST_VARIABLE",
  },
  {
    key: "values",
    label: l10n("FIELD_VALUES"),
    description: l10n("FIELD_ARRAY_VALUES_SET_DESC"),
    type: "arraySet",
    defaultValue: [],
  },
];

const compile = (input, helpers) => {
  const { arraySetToScriptValues } = helpers;
  arraySetToScriptValues(input.array, input.values);
};

module.exports = {
  id,
  description: l10n("EVENT_ARRAY_SET_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
};

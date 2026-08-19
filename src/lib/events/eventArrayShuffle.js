const l10n = require("../helpers/l10n").default;

const id = "EVENT_ARRAY_SHUFFLE";
const groups = ["EVENT_GROUP_VARIABLES"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ARRAY_SHUFFLE_LABEL", {
    array: fetchArg("array"),
  });
};

const fields = [
  {
    key: "array",
    description: l10n("FIELD_ARRAY_DESC"),
    type: "variable",
    variableType: "arrayReference",
    defaultValue: "LAST_VARIABLE",
  },
];

const compile = (input, helpers) => {
  const { arrayShuffle } = helpers;
  arrayShuffle(input.array);
};

module.exports = {
  id,
  description: l10n("EVENT_ARRAY_SHUFFLE_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
};

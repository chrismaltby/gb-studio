const l10n = require("../helpers/l10n").default;

const id = "EVENT_DEC_VALUE";
const groups = ["EVENT_GROUP_VARIABLES"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_DEC_VALUE_LABEL", { variable: fetchArg("variable") });
};

const fields = [
  {
    key: "variable",
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
  autoLabel,
  groups,
  fields,
  compile,
};

const l10n = require("../helpers/l10n").default;

const id = "EVENT_RESET_VARIABLES";
const groups = ["EVENT_GROUP_VARIABLES"];

const fields = [
  {
    label: l10n("FIELD_RESET_VARIABLES"),
  },
];

const compile = (input, helpers) => {
  const { variablesReset } = helpers;
  variablesReset();
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};

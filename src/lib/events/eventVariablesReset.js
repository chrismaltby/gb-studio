const l10n = require("../helpers/l10n").default;

const id = "EVENT_RESET_VARIABLES";
const groups = ["EVENT_GROUP_VARIABLES"];
const subGroups = {
  EVENT_GROUP_VARIABLES: "EVENT_GROUP_RESET",
};

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
  description: l10n("EVENT_RESET_VARIABLES_DESC"),
  groups,
  subGroups,
  fields,
  compile,
};

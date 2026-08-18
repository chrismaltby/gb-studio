const l10n = require("../helpers/l10n").default;

const id = "EVENT_ARRAY_FOR_EACH";
const groups = ["EVENT_GROUP_VARIABLES", "EVENT_GROUP_CONTROL_FLOW"];
const subGroups = {
  EVENT_GROUP_VARIABLES: "EVENT_GROUP_CONTROL_FLOW",
  EVENT_GROUP_CONTROL_FLOW: "EVENT_GROUP_VARIABLES",
};

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ARRAY_FOR_EACH_LABEL", {
    variable: fetchArg("variable"),
    array: fetchArg("array"),
  });
};

const fields = [
  {
    key: "variable",
    label: l10n("FIELD_FOR"),
    description: l10n("FIELD_VARIABLE_DESC"),
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
  {
    key: "array",
    label: l10n("FIELD_IN_ARRAY"),
    description: l10n("FIELD_IN_ARRAY_DESC"),
    type: "variable",
    variableType: "arrayReference",
    defaultValue: "LAST_VARIABLE",
  },
  {
    key: "true",
    type: "events",
  },
];

const compile = (input, helpers) => {
  const { arrayForEach } = helpers;
  arrayForEach(input.variable, input.array, input.true);
};

module.exports = {
  id,
  description: l10n("EVENT_ARRAY_FOR_EACH_DESC"),
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
};

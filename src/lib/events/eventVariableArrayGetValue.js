const l10n = require("../helpers/l10n").default;

const id = "EVENT_ARRAY_GET_VALUE";
const groups = ["EVENT_GROUP_VARIABLES"];

const autoLabel = (fetchArg, args) => {
  if (args.array) {
    return l10n("EVENT_ARRAY_GET_VALUE_LABEL", {
      array: fetchArg("array"),
      index: fetchArg("index"),
      variable: fetchArg("variable"),
    });
  } else {
    return l10n("EVENT_ARRAY_GET_VALUE");
  }
};

const fields = [
  {
    key: "array",
    label: l10n("FIELD_VARIABLE_ARRAY"),
    description: l10n("FIELD_VARIABLE_ARRAY_GET_DESC"),
    type: "variableArray",
    defaultValue: "",
  },
  {
    key: "index",
    label: l10n("FIELD_INDEX"),
    description: l10n("FIELD_ARRAY_INDEX_GET_DESC"),
    type: "value",
    width: "50%",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "variable",
    label: l10n("FIELD_VARIABLE"),
    description: l10n("FIELD_ARRAY_GET_VARIABLE_DESC"),
    type: "variable",
    width: "50%",
    defaultValue: "LAST_VARIABLE",
  },
];

const compile = (input, helpers) => {
  const { variableArrayGetValue } = helpers;
  variableArrayGetValue(input.variable, input.array, input.index);
};

module.exports = {
  id,
  description: l10n("EVENT_ARRAY_GET_VALUE_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
};

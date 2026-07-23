const l10n = require("../helpers/l10n").default;

const id = "EVENT_ARRAY_SET_VALUE";
const groups = ["EVENT_GROUP_VARIABLES"];

const autoLabel = (fetchArg, args) => {
  if (args.array) {
    return l10n("EVENT_ARRAY_SET_VALUE_LABEL", {
      array: fetchArg("array"),
      index: fetchArg("index"),
      value: fetchArg("value"),
    });
  } else {
    return l10n("EVENT_ARRAY_SET_VALUE");
  }
};

const fields = [
  {
    key: "array",
    label: l10n("FIELD_VARIABLE_ARRAY"),
    description: l10n("FIELD_VARIABLE_ARRAY_DESC"),
    type: "variableArray",
    defaultValue: "",
  },
  {
    key: "index",
    label: l10n("FIELD_INDEX"),
    description: l10n("FIELD_ARRAY_INDEX_DESC"),
    type: "value",
    width: "50%",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
  {
    key: "value",
    label: l10n("FIELD_VALUE"),
    description: l10n("FIELD_VALUE_SET_DESC"),
    type: "value",
    width: "50%",
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
];

const compile = (input, helpers) => {
  const { variableArraySetValue } = helpers;
  variableArraySetValue(input.array, input.index, input.value);
};

module.exports = {
  id,
  description: l10n("EVENT_ARRAY_SET_VALUE_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
};

const l10n = require("../helpers/l10n").default;

const id = "EVENT_ARRAY_SET";
const groups = ["EVENT_GROUP_VARIABLES"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ARRAY_SET_LABEL", {
    variable: fetchArg("variable"),
    index: fetchArg("index"),
    value: fetchArg("value"),
  });
};

const fields = [
  {
    type: "group",
    fields: [
      {
        key: "variable",
        label: "FIELD_VARIABLE",
        type: "variable",
        defaultValue: "LAST_VARIABLE",
      },
      {
        key: "index",
        label: "FIELD_INDEX",
        type: "union",
        types: ["number", "variable"],
        defaultType: "number",
        min: 0,
        max: 255,
        defaultValue: {
          number: 0,
          variable: "LAST_VARIABLE",
        },
      },
    ],
  },
  {
    key: "value",
    label: "FIELD_SET_TO_VALUE",
    type: "union",
    types: ["number", "variable"],
    defaultType: "number",
    min: -32768,
    max: 32767,
    defaultValue: {
      number: 0,
      variable: "LAST_VARIABLE",
    },
  },
];

const compile = (input, helpers) => {
  const { variableArraySetToUnionValue } = helpers;
  variableArraySetToUnionValue(input.variable, input.index, input.value);
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};

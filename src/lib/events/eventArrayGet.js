const l10n = require("../helpers/l10n").default;

const id = "EVENT_ARRAY_GET";
const groups = ["EVENT_GROUP_VARIABLES"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ARRAY_GET_LABEL", {
    variable: fetchArg("variable"),
    arrayVariable: fetchArg("arrayVariable"),
    index: fetchArg("index"),
  });
};

const fields = [
  {
    key: "variable",
    label: l10n("FIELD_SET_VARIABLE"),
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
  {
    type: "group",
    fields: [
      {
        key: "arrayVariable",
        label: l10n("FIELD_FROM_VARIABLE"),
        type: "variable",
        defaultValue: "LAST_VARIABLE",
      },
      {
        key: "index",
        label: l10n("FIELD_INDEX"),
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
];

const compile = (input, helpers) => {
  const { variableSetToArrayValue } = helpers;
  variableSetToArrayValue(input.variable, input.arrayVariable, input.index);
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};

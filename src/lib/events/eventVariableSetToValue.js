const l10n = require("../helpers/l10n").default;

const id = "EVENT_SET_VALUE";
const groups = ["EVENT_GROUP_VARIABLES"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_SET_VALUE_LABEL", {
    variable: fetchArg("variable"),
    value: fetchArg("value"),
  });
};

const fields = [
  {
    key: "variable",
    label: l10n("FIELD_VARIABLE"),
    description: l10n("FIELD_VARIABLE_DESC"),
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
  {
    key: "value",
    label: l10n("FIELD_VALUE"),
    description: l10n("FIELD_VALUE_SET_DESC"),
    type: "union",
    types: ["number", "variable", "property"],
    defaultType: "number",
    min: -32768,
    max: 32767,
    defaultValue: {
      number: 0,
      variable: "LAST_VARIABLE",
      property: "$self$:xpos",
    },
  },
];

const compile = (input, helpers) => {
  const { variableSetToUnionValue } = helpers;

  if (input.value.type === "number") {
    const value = parseInt(input.value.value, 10);
    if (value === 1) {
      const { variableSetToTrue } = helpers;
      variableSetToTrue(input.variable);
    } else if (value === 0 || isNaN(value)) {
      const { variableSetToFalse } = helpers;
      variableSetToFalse(input.variable);
    } else {
      const { variableSetToValue } = helpers;
      variableSetToValue(input.variable, value);
    }
  } else {
    variableSetToUnionValue(input.variable, input.value);
  }
};

module.exports = {
  id,
  description: l10n("EVENT_SET_VALUE_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
};

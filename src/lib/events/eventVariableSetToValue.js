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
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
  {
    key: "value",
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
  autoLabel,
  groups,
  fields,
  compile,
};

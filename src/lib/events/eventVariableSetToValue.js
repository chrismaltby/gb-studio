const id = "EVENT_SET_VALUE";

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
    min: 0,
    max: 255,
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
    if (value > 1) {
      const { variableSetToValue } = helpers;
      variableSetToValue(input.variable, value);
    } else if (value === 1) {
      const { variableSetToTrue } = helpers;
      variableSetToTrue(input.variable);
    } else {
      const { variableSetToFalse } = helpers;
      variableSetToFalse(input.variable);
    }
  } else {
    variableSetToUnionValue(input.variable, input.value);
  }
};

module.exports = {
  id,
  fields,
  compile,
  allowedBeforeInitFade: true,
};

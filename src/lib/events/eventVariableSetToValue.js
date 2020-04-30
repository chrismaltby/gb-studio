export const id = "EVENT_SET_VALUE";

export const fields = [
  {
    key: "variable",
    type: "variable",
    defaultValue: "LAST_VARIABLE"
  },
  {
    key: "value",
    type: "number",
    min: 0,
    max: 255,
    defaultValue: "0"
  }
];

export const compile = (input, helpers) => {
  const value = parseInt(input.value, 10);
  if (value > 1)  {
    const { variableSetToValue } = helpers;
    variableSetToValue(input.variable, value);
  } else if (value === 1) {
    const { variableSetToTrue } = helpers;
    variableSetToTrue(input.variable);
  } else {
    const { variableSetToFalse } = helpers;
    variableSetToFalse(input.variable);
  }
};

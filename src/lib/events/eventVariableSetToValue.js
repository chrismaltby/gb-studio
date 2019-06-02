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
  const { variableSetToValue } = helpers;
  variableSetToValue(input.variable, input.value);
};

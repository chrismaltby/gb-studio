export const id = "EVENT_SET_FALSE";

export const fields = [
  {
    key: "variable",
    type: "variable",
    defaultValue: "LAST_VARIABLE"
  }
];

export const compile = (input, helpers) => {
  const { variableSetToFalse } = helpers;
  variableSetToFalse(input.variable);
};

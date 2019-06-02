export const id = "EVENT_INC_VALUE";

export const fields = [
  {
    key: "variable",
    type: "variable",
    defaultValue: "LAST_VARIABLE"
  }
];

export const compile = (input, helpers) => {
  const { variableInc } = helpers;
  variableInc(input.variable);
};

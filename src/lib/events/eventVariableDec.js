export const id = "EVENT_DEC_VALUE";

export const fields = [
  {
    key: "variable",
    type: "variable",
    defaultValue: "LAST_VARIABLE"
  }
];

export const compile = (input, helpers) => {
  const { variableDec } = helpers;
  variableDec(input.variable);
};

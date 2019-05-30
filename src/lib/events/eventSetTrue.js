export const id = "EVENT_SET_TRUE";

export const fields = [
  {
    key: "variable",
    type: "variable",
    defaultValue: "LAST_VARIABLE"
  }
];

export const compile = (input, helpers) => {
  const { setTrue } = helpers;
  setTrue(input.variable);
};

export const id = "EVENT_IF_TRUE";

export const fields = [
  {
    key: "variable",
    type: "variable",
    defaultValue: "LAST_VARIABLE"
  },
  {
    key: "true",
    type: "events"
  },
  {
    key: "__collapseElse",
    label: "Else",
    type: "collapsable",
    defaultValue: false
  },
  {
    key: "false",
    showIfNotKey: "__collapseElse",
    type: "events"
  }
];

export const compile = (input, helpers) => {
  const { ifVariableTrue } = helpers;
  ifVariableTrue(input.variable, input.true, input.false);
};

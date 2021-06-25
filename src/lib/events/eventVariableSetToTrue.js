const id = "EVENT_SET_TRUE";
const groups = ["EVENT_GROUP_VARIABLES"];

const fields = [
  {
    key: "variable",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
];

const compile = (input, helpers) => {
  const { variableSetToTrue } = helpers;
  variableSetToTrue(input.variable);
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};

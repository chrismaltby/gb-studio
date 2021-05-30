const id = "EVENT_SET_FALSE";

const fields = [
  {
    key: "variable",
    type: "variable",
    defaultValue: "LAST_VARIABLE"
  }
];

const compile = (input, helpers) => {
  const { variableSetToFalse } = helpers;
  variableSetToFalse(input.variable);
};

module.exports = {
  id,
  fields,
  compile
};

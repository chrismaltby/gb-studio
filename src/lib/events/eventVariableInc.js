const id = "EVENT_INC_VALUE";

const fields = [
  {
    key: "variable",
    type: "variable",
    defaultValue: "LAST_VARIABLE"
  }
];

const compile = (input, helpers) => {
  const { variableInc } = helpers;
  variableInc(input.variable);
};

module.exports = {
  id,
  fields,
  compile
};

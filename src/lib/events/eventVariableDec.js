const id = "EVENT_DEC_VALUE";

const fields = [
  {
    key: "variable",
    type: "variable",
    defaultValue: "LAST_VARIABLE"
  }
];

const compile = (input, helpers) => {
  const { variableDec } = helpers;
  variableDec(input.variable);
};

module.exports = {
  id,
  fields,
  compile
};

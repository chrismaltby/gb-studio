const id = "EVENT_DEC_VALUE";
const groups = ["EVENT_GROUP_VARIABLES"];

const fields = [
  {
    key: "variable",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
];

const compile = (input, helpers) => {
  const { variableDec } = helpers;
  variableDec(input.variable);
};

module.exports = {
  id,
  groups,
  fields,
  compile,
  allowedBeforeInitFade: true,
};

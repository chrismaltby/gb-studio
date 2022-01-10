const id = "EVENT_GROUP";
const groups = ["EVENT_GROUP_MISC"];

const fields = [
  {
    key: "true",
    type: "events",
  },
];

const compile = (input, helpers) => {
  const { compileEvents } = helpers;
  compileEvents(input.true);
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};

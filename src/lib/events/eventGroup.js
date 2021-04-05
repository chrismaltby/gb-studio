const id = "EVENT_GROUP";

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
  fields,
  compile,
  allowedBeforeInitFade: true,
};

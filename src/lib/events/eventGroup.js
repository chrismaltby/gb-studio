const id = "EVENT_GROUP";
const group = "EVENT_GROUP_MISC";

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
  group,
  fields,
  compile,
  allowedBeforeInitFade: true,
};

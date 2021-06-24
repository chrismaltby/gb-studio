const id = "EVENT_GBVM_SCRIPT";
const group = "EVENT_GROUP_MISC";

const fields = [
  {
    key: "script",
    type: "textarea",
  },
];

const compile = (input, helpers) => {
  const { appendRaw } = helpers;
  appendRaw(input.script);
};

module.exports = {
  id,
  group,
  fields,
  compile,
  allowedBeforeInitFade: true,
};

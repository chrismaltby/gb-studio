const id = "EVENT_GBVM_SCRIPT";
const groups = ["EVENT_GROUP_MISC"];

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
  groups,
  fields,
  compile,
};

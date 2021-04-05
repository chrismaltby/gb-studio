const id = "EVENT_GBVM_SCRIPT";

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
  fields,
  compile,
  allowedBeforeInitFade: true,
};

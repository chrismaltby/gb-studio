const l10n = require("../helpers/l10n").default;

const id = "EVENT_AWAIT_INPUT";
const groups = ["EVENT_GROUP_INPUT"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_AWAIT_INPUT_LABEL", {
    input: fetchArg("input"),
  });
};

const fields = [
  {
    key: "input",
    label: l10n("FIELD_ANY_OF"),
    type: "input",
    defaultValue: ["a", "b"],
  },
];

const compile = (input, helpers) => {
  const { inputAwait } = helpers;
  inputAwait(input.input);
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};

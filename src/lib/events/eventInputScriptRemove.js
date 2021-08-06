const l10n = require("../helpers/l10n").default;

const id = "EVENT_REMOVE_INPUT_SCRIPT";
const groups = ["EVENT_GROUP_INPUT"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_REMOVE_INPUT_LABEL", {
    input: fetchArg("input"),
  });
};

const fields = [
  {
    key: "input",
    label: l10n("FIELD_REMOVE_INPUT_SCRIPT_ON"),
    type: "input",
    defaultValue: ["b"],
  },
];

const compile = (input, helpers) => {
  const { inputScriptRemove } = helpers;
  inputScriptRemove(input.input);
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};

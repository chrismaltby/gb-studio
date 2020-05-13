const l10n = require("../helpers/l10n");

const id = "EVENT_REMOVE_INPUT_SCRIPT";

const fields = [
  {
    key: "input",
    label: l10n("FIELD_REMOVE_INPUT_SCRIPT_ON"),
    type: "input",
    defaultValue: ["b"]
  }
];

const compile = (input, helpers) => {
  const { inputScriptRemove } = helpers;
  inputScriptRemove(input.input);
};

module.exports = {
  id,
  fields,
  compile
};

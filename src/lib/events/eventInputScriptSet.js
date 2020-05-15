const l10n = require("../helpers/l10n").default;

const id = "EVENT_SET_INPUT_SCRIPT";

const fields = [
  {
    key: "input",
    label: l10n("FIELD_ON_PRESS"),
    type: "input",
    defaultValue: "b"
  },
  {
    key: "true",
    type: "events"
  }
];

const compile = (input, helpers) => {
  const { inputScriptSet } = helpers;
  inputScriptSet(input.input, input.true);
};

module.exports = {
  id,
  fields,
  compile
};

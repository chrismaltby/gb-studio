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
    key: "persist",
    label: l10n("FIELD_PERSIST_BETWEEN_SCENES"),
    type: "checkbox",
    defaultValue: false
  },
  {
    label: l10n("FIELD_PERSIST_BETWEEN_SCENES_WARNING"),
    conditions: [
      {
        key: "persist",
        eq: true
      }
    ]
  },  
  {
    key: "true",
    type: "events"
  }
];

const compile = (input, helpers) => {
  const { inputScriptSet } = helpers;
  inputScriptSet(input.input, input.persist, input.true);
};

module.exports = {
  id,
  fields,
  compile
};

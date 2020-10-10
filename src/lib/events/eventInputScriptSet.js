const l10n = require("../helpers/l10n").default;

const id = "EVENT_SET_INPUT_SCRIPT";

const fields = [
  {
    key: "input",
    type: "input",
    defaultValue: ["b"]
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
    key: "__scriptTabs",
    type: "tabs",
    defaultValue: "press",
    values: {
      press: l10n("FIELD_ON_PRESS"),
    }
  },
  {
    key: "true",
    type: "events",
    conditions: [
      {
        key: "__scriptTabs",
        in: [undefined, "press"]
      }
    ]
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

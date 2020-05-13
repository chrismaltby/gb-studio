const l10n = require("../helpers/l10n");

const id = "EVENT_CHOICE";

const fields = [
  {
    key: "variable",
    type: "variable",
    defaultValue: "LAST_VARIABLE"
  },
  {
    key: "trueText",
    label: l10n("FIELD_SET_TRUE_IF"),
    type: "text",
    maxLength: 17,
    defaultValue: "",
    placeholder: l10n("FIELD_CHOICE_A")
  },
  {
    key: "falseText",
    label: l10n("FIELD_SET_FALSE_IF"),
    type: "text",
    maxLength: 17,
    defaultValue: "",
    placeholder: l10n("FIELD_CHOICE_B")
  }
];

const compile = (input, helpers) => {
  const { textChoice } = helpers;
  const { variable, trueText, falseText } = input;
  textChoice(variable, { trueText, falseText });
};

module.exports = {
  id,
  fields,
  compile
};

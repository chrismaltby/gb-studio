const trimlines = require("shared/lib/helpers/trimlines");
const l10n = require("../helpers/l10n").default;

const trimChoiceItem = (string) => {
  return trimlines(string, 17, 1);
};

const id = "EVENT_CHOICE";
const groups = ["EVENT_GROUP_DIALOGUE"];

const autoLabel = (fetchArg) => {
  const text = [
    `"${fetchArg("trueText")}"`,
    `"${fetchArg("falseText")}"`,
  ].join();
  return l10n("EVENT_CHOICE_LABEL", {
    variable: fetchArg("variable"),
    text,
  });
};

const fields = [
  {
    key: "variable",
    label: l10n("FIELD_SET_VARIABLE"),
    description: l10n("FIELD_VARIABLE_DESC"),
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
  {
    type: "break",
  },
  {
    key: "trueText",
    label: l10n("FIELD_SET_TRUE_IF"),
    description: l10n("FIELD_SET_TRUE_IF_DESC"),
    type: "text",
    updateFn: trimChoiceItem,
    defaultValue: "",
    placeholder: l10n("FIELD_CHOICE_A"),
  },
  {
    key: "falseText",
    label: l10n("FIELD_SET_FALSE_IF"),
    description: l10n("FIELD_SET_FALSE_IF_DESC"),
    type: "text",
    updateFn: trimChoiceItem,
    defaultValue: "",
    placeholder: l10n("FIELD_CHOICE_B"),
  },
];

const compile = (input, helpers) => {
  const { textChoice } = helpers;
  const { variable, trueText, falseText } = input;
  textChoice(variable, { trueText, falseText });
};

module.exports = {
  id,
  description: l10n("EVENT_CHOICE_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};

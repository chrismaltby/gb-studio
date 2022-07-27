const l10n = require("../helpers/l10n").default;

const id = "EVENT_GET_DIGIT";
const groups = ["EVENT_GROUP_MATH", "EVENT_GROUP_VARIABLES"];

const autoLabel = (fetchArg) => {
  const digitLookup = {
    1: l10n("FIELD_ONES"),
    10: l10n("FIELD_TENS"),
    100: l10n("FIELD_HUNDREDS"),
    1000: l10n("FIELD_THOUSANDS"),
    10000: l10n("FIELD_TEN_THOUSANDS")
  };
  return l10n("EVENT_GET_DIGIT_LABEL", {
    value: fetchArg("val"),
    digit: digitLookup[fetchArg("digit")],
    variable: fetchArg("variable"),
  });
};

const fields = [
  {
    type: "group",
    fields: [
      {
        key: "val",
        label: l10n("FIELD_VALUE"),
        type: "union",
        types: ["number", "variable", "property"],
        defaultType: "number",
        min: -32768,
        max: 32767,
        width: "50%",
        defaultValue: {
          number: 0,
          variable: "LAST_VARIABLE",
          property: "$self$:xpos",
        },
      },
      {
        key: "digit",
        label: l10n("FIELD_DIGIT"),
        type: "digit",
        width: "50%",
        defaultValue: 1,
      },
    ],
  },
  {
    key: "variable",
    label: l10n("FIELD_VARIABLE"),
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
];

const compile = (input, helpers) => {
  const { getDigit, getDigitVariable, variableFromUnion, temporaryEntityVariable } = helpers;
  if (input.val.type === "number") {
    getDigit(input.val.value, input.digit, input.variable);
  } else {
    const value = variableFromUnion(input.val, temporaryEntityVariable(0));
    getDigitVariable(value, input.digit, input.variable);
  }
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};

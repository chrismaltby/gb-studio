const l10n = require("../helpers/l10n").default;

const id = "EVENT_VARIABLE_MATH_EVALUATE";
const groups = ["EVENT_GROUP_MATH", "EVENT_GROUP_VARIABLES"];
const subGroups = {
  EVENT_GROUP_MATH: "EVENT_GROUP_VARIABLES",
  EVENT_GROUP_VARIABLES: "EVENT_GROUP_MATH",
};

const autoLabel = (fetchArg, args) => {
  if (args.expression) {
    return l10n("EVENT_VARIABLE_MATH_EVALUATE_LABEL", {
      variable: fetchArg("variable"),
      expression: fetchArg("expression"),
    });
  } else {
    return l10n("EVENT_VARIABLE_MATH_EVALUATE");
  }
};

const fields = [
  {
    key: "variable",
    label: l10n("FIELD_VARIABLE"),
    description: l10n("FIELD_VARIABLE_DESC"),
    type: "variable",
    defaultValue: "LAST_VARIABLE",
    width: "50%",
  },
  {
    key: "expression",
    label: l10n("FIELD_EXPRESSION"),
    description: l10n("FIELD_EXPRESSION_DESC"),
    type: "matharea",
    rows: 5,
    placeholder: "e.g. 5 + (6 * $health)...",
    defaultValue: "",
  },
];

const compile = (input, helpers) => {
  const { variableEvaluateExpression } = helpers;
  variableEvaluateExpression(input.variable, input.expression || "0");
};

module.exports = {
  id,
  description: l10n("EVENT_VARIABLE_MATH_EVALUATE_DESC"),
  references: ["/docs/scripting/math-expressions"],
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
};

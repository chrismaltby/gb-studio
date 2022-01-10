const l10n = require("../helpers/l10n").default;

const id = "EVENT_VARIABLE_MATH_EVALUATE";
const groups = ["EVENT_GROUP_MATH", "EVENT_GROUP_VARIABLES"];

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
    type: "variable",
    defaultValue: "LAST_VARIABLE",
    width: "50%",
  },
  {
    key: "expression",
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
  autoLabel,
  groups,
  fields,
  compile,
};

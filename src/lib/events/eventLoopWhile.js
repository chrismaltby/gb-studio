const l10n = require("../helpers/l10n").default;

const id = "EVENT_LOOP_WHILE";
const groups = ["EVENT_GROUP_CONTROL_FLOW"];

const autoLabel = (fetchArg, args) => {
  if (args.expression) {
    return l10n("EVENT_LOOP_WHILE_LABEL", {
      expression: fetchArg("expression"),
    });
  } else {
    return l10n("EVENT_LOOP_WHILE");
  }
};

const fields = [
  {
    key: "expression",
    label: l10n("FIELD_EXPRESSION"),
    description: l10n("FIELD_EXPRESSION_DESC"),
    type: "matharea",
    rows: 5,
    placeholder: "e.g. $health >= 0...",
    defaultValue: "",
  },
  {
    key: "true",
    type: "events",
  },
];

const compile = (input, helpers) => {
  const { whileExpression } = helpers;
  const truePath = input.true;
  whileExpression(input.expression || "0", truePath);
};

module.exports = {
  id,
  description: l10n("EVENT_LOOP_WHILE_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
};

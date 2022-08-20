const l10n = require("../helpers/l10n").default;

const id = "EVENT_LOOP_DO_WHILE";
const groups = ["EVENT_GROUP_CONTROL_FLOW"];

const autoLabel = (fetchArg, args) => {
  if (args.expression) {
    return l10n("EVENT_LOOP_DO_WHILE_LABEL", {
      expression: fetchArg("expression"),
    });
  } else {
    return l10n("EVENT_LOOP_DO_WHILE");
  }
};

const fields = [
  {
    key: "true",
    type: "events",
  },
  {
    key: "expression",
    type: "matharea",
    rows: 5,
    placeholder: "e.g. $health >= 0...",
    defaultValue: "",
  },
];

const compile = (input, helpers) => {
  const { doWhileExpression } = helpers;
  const truePath = input.true;
  doWhileExpression(input.expression || "0", truePath);
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};

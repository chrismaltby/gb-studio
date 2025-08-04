const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_EXPRESSION";
const groups = ["EVENT_GROUP_MATH", "EVENT_GROUP_CONTROL_FLOW"];

const autoLabel = (fetchArg, args) => {
  if (args.expression) {
    return l10n("EVENT_IF_EXPRESSION_LABEL", {
      expression: fetchArg("expression"),
    });
  } else {
    return l10n("EVENT_IF_EXPRESSION");
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
    label: l10n("FIELD_TRUE"),
    description: l10n("FIELD_TRUE_DESC"),
    type: "events",
  },
  {
    key: "__collapseElse",
    label: l10n("FIELD_ELSE"),
    type: "collapsable",
    defaultValue: true,
    conditions: [
      {
        key: "__disableElse",
        ne: true,
      },
    ],
  },
  {
    key: "false",
    label: l10n("FIELD_FALSE"),
    description: l10n("FIELD_FALSE_DESC"),
    conditions: [
      {
        key: "__collapseElse",
        ne: true,
      },
      {
        key: "__disableElse",
        ne: true,
      },
    ],
    type: "events",
  },
];

const compile = (input, helpers) => {
  const { ifExpression } = helpers;
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  ifExpression(input.expression || "0", truePath, falsePath);
};

module.exports = {
  id,
  description: l10n("EVENT_IF_EXPRESSION_DESC"),
  references: ["/docs/scripting/math-expressions"],
  autoLabel,
  groups,
  fields,
  compile,
  deprecated: true,
};

const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_VALUE_COMPARE";
const groups = ["EVENT_GROUP_VARIABLES", "EVENT_GROUP_CONTROL_FLOW"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_IF_VALUE_COMPARE_LABEL", {
    variable: fetchArg("vectorX"),
    operator: fetchArg("operator"),
    value: fetchArg("vectorY"),
  });
};

const fields = [
  {
    key: "vectorX",
    label: l10n("FIELD_VARIABLE"),
    description: l10n("FIELD_VARIABLE_DESC"),
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
  {
    key: "operator",
    label: l10n("FIELD_COMPARISON"),
    description: l10n("FIELD_COMPARISON_DESC"),
    type: "operator",
    width: "50%",
    defaultValue: "==",
  },
  {
    key: "vectorY",
    label: l10n("FIELD_OTHER_VARIABLE"),
    description: l10n("FIELD_VARIABLE_COMPARE_DESC"),
    type: "variable",
    defaultValue: "LAST_VARIABLE",
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
  const { ifVariableCompare } = helpers;
  const operationLookup = {
    "==": ".EQ",
    "!=": ".NE",
    "<": ".LT",
    ">": ".GT",
    "<=": ".LTE",
    ">=": ".GTE",
  };
  const operation = operationLookup[input.operator];

  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  ifVariableCompare(
    input.vectorX,
    operation,
    input.vectorY,
    truePath,
    falsePath,
  );
};

module.exports = {
  id,
  description: l10n("EVENT_IF_VALUE_COMPARE_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
  deprecated: true,
};

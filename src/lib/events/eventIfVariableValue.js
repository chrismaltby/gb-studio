const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_VALUE";
const groups = ["EVENT_GROUP_VARIABLES", "EVENT_GROUP_CONTROL_FLOW"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_IF_VALUE_COMPARE_LABEL", {
    variable: fetchArg("variable"),
    operator: fetchArg("operator"),
    value: fetchArg("comparator"),
  });
};

const fields = [
  {
    key: "variable",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
  {
    key: "operator",
    type: "operator",
    width: "50%",
    defaultValue: "==",
  },
  {
    key: "comparator",
    type: "number",
    min: -32768,
    max: 32767,
    width: "50%",
    defaultValue: "0",
  },
  {
    key: "true",
    label: l10n("FIELD_TRUE"),
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
  const { ifVariableValue } = helpers;
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
  ifVariableValue(
    input.variable,
    operation,
    input.comparator || 0,
    truePath,
    falsePath
  );
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};

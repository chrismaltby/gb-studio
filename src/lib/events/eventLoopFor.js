const l10n = require("../helpers/l10n").default;

const id = "EVENT_LOOP_FOR";
const groups = ["EVENT_GROUP_CONTROL_FLOW"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_LOOP_FOR_LABEL", {
    variable: fetchArg("variable"),
    from: fetchArg("from"),
    comparison: fetchArg("comparison"),
    to: fetchArg("to"),
    operation: fetchArg("operation"),
    val: fetchArg("value"),
  });
};

const fields = [
  {
    key: "variable",
    label: l10n("FIELD_FOR"),
    description: l10n("FIELD_VARIABLE_DESC"),
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
  {
    type: "group",
    fields: [
      {
        key: "from",
        label: l10n("FIELD_FROM"),
        description: l10n("FIELD_FROM_FOR_DESC"),
        type: "value",
        min: -32768,
        max: 32767,
        defaultValue: {
          type: "number",
          value: 0,
        },
      },
      {
        key: "comparison",
        label: l10n("FIELD_COMPARISON"),
        description: l10n("FIELD_COMPARISON_DESC"),
        type: "operator",
        defaultValue: "<=",
      },
      {
        key: "to",
        label: l10n("FIELD_TO"),
        description: l10n("FIELD_TO_FOR_DESC"),
        type: "value",
        min: -32768,
        max: 32767,
        defaultValue: {
          type: "number",
          value: 10,
        },
      },
    ],
    flexBasis: 200,
  },
  {
    type: "group",
    fields: [
      {
        key: "operation",
        label: l10n("FIELD_OPERATION"),
        description: l10n("FIELD_OPERATION_FOR_DESC"),
        type: "mathOperator",
        defaultValue: "+=",
      },
      {
        key: "value",
        label: l10n("FIELD_VALUE"),
        description: l10n("FIELD_VALUE_FOR_DESC"),
        type: "value",
        min: -32768,
        max: 32767,
        defaultValue: {
          type: "number",
          value: 1,
        },
      },
    ],
    flexBasis: 150,
  },
  {
    key: "true",
    type: "events",
  },
];

const compile = (input, helpers) => {
  const {
    labelDefine,
    labelGoto,
    getNextLabel,
    compileEvents,
    ifVariableCompareScriptValue,
    variablesScriptValueOperation,
    variableSetToScriptValue,
  } = helpers;
  const comparisonLookup = {
    "==": ".EQ",
    "!=": ".NE",
    "<": ".LT",
    ">": ".GT",
    "<=": ".LTE",
    ">=": ".GTE",
  };
  const comparison = comparisonLookup[input.comparison];

  const operationLookup = {
    "+=": ".ADD",
    "-=": ".SUB",
    "*=": ".MUL",
    "/=": ".DIV",
    "%=": ".MOD",
  };
  const operation = operationLookup[input.operation];

  const loopId = getNextLabel();
  variableSetToScriptValue(input.variable, input.from);
  labelDefine(loopId);
  ifVariableCompareScriptValue(input.variable, comparison, input.to, () => {
    compileEvents(input.true);
    variablesScriptValueOperation(input.variable, operation, input.value);
    labelGoto(loopId);
  });
};

module.exports = {
  id,
  description: l10n("EVENT_LOOP_FOR_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
};

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
    val: fetchArg("val"),
  });
};

const fields = [
  {
    key: "variable",
    label: l10n("FIELD_FOR"),
    type: "variable",
    defaultValue: "LAST_VARIABLE",
    width: "50%",
  },
  {
    type: "group",
    fields: [
      {
        key: "from",
        label: l10n("FIELD_FROM"),
        type: "union",
        types: ["number", "variable"],
        defaultType: "number",
        min: -32768,
        max: 32767,
        defaultValue: {
          number: 0,
          variable: "LAST_VARIABLE",
        },
      },
      {
        key: "comparison",
        label: l10n("FIELD_COMPARISON"),
        type: "operator",
        defaultValue: "<=",
      },
      {
        key: "to",
        label: l10n("FIELD_TO"),
        type: "union",
        types: ["number", "variable"],
        defaultType: "number",
        min: -32768,
        max: 32767,
        defaultValue: {
          number: 10,
          variable: "LAST_VARIABLE",
        },
      },
    ],
  },
  {
    type: "group",
    fields: [
      {
        key: "operation",
        label: l10n("FIELD_OPERATION"),
        type: "math_operator",
        defaultValue: "+=",
      },
      {
        key: "val",
        label: l10n("FIELD_BY_VALUE"),
        type: "union",
        types: ["number", "variable"],
        defaultType: "number",
        min: -32768,
        max: 32767,
        defaultValue: {
          number: 1,
          variable: "LAST_VARIABLE",
        },
      },
    ],
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
    ifVariableValue,
    ifVariableCompare,
    variableValueOperation,
    variablesOperation,
    variableSetToValue,
    variableCopy,
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
  let ifOp = input.to.type === "number" ? ifVariableValue : ifVariableCompare;
  let performOp =
    input.val.type === "number" ? variableValueOperation : variablesOperation;
  let setOp = input.from.type === "number" ? variableSetToValue : variableCopy;

  setOp(input.variable, input.from.value);
  labelDefine(loopId);
  ifOp(input.variable, comparison, input.to.value, () => {
    compileEvents(input.true);
    performOp(input.variable, operation, input.val.value);
    labelGoto(loopId);
  });
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};

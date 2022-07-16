const l10n = require("../helpers/l10n").default;

const id = "EVENT_LOOP_FOR";
const groups = ["EVENT_GROUP_CONTROL_FLOW"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_LOOP_FOR_LABEL", {
    variable: fetchArg("variable"),
    from: fetchArg("from"),
    to: fetchArg("to"),
    inc: fetchArg("inc"),
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
      {
        key: "inc",
        label: l10n("FIELD_INC_BY"),
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
  const loopId = getNextLabel();
  let ifOp = input.to.type === "number" ? ifVariableValue : ifVariableCompare;
  let addOp =
    input.inc.type === "number" ? variableValueOperation : variablesOperation;
  let setOp = input.from.type === "number" ? variableSetToValue : variableCopy;

  setOp(input.variable, input.from.value);
  labelDefine(loopId);
  ifOp(input.variable, ".LTE", input.to.value, () => {
    compileEvents(input.true);
    addOp(input.variable, ".ADD", input.inc.value);
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

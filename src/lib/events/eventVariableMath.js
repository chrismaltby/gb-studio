const l10n = require("../helpers/l10n").default;

const id = "EVENT_VARIABLE_MATH";
const groups = ["EVENT_GROUP_MATH", "EVENT_GROUP_VARIABLES"];

const fields = [
  {
    key: "vectorX",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
  {
    key: "operation",
    type: "select",
    options: [
      ["set", l10n("FIELD_SET_TO")],
      ["add", l10n("FIELD_ADD_VALUE")],
      ["sub", l10n("FIELD_SUB_VALUE")],
      ["mul", l10n("FIELD_MUL_VARIABLE")],
      ["div", l10n("FIELD_DIV_VARIABLE")],
      ["mod", l10n("FIELD_MOD_VARIABLE")],
    ],
    defaultValue: "set",
    width: "50%",
  },
  {
    key: "other",
    type: "select",
    options: [
      ["true", l10n("FIELD_TRUE")],
      ["false", l10n("FIELD_FALSE")],
      ["var", l10n("FIELD_VARIABLE")],
      ["val", l10n("FIELD_VALUE")],
      ["rnd", l10n("FIELD_RANDOM")],
    ],
    defaultValue: "true",
    width: "50%",
  },
  {
    key: "vectorY",
    type: "variable",
    conditions: [
      {
        key: "other",
        eq: "var",
      },
    ],
    defaultValue: "LAST_VARIABLE",
  },
  {
    key: "value",
    type: "number",
    conditions: [
      {
        key: "other",
        eq: "val",
      },
    ],
    min: 0,
    max: 255,
    defaultValue: "0",
  },
  {
    key: "minValue",
    type: "number",
    conditions: [
      {
        key: "other",
        eq: "rnd",
      },
    ],
    min: 0,
    max: 255,
    label: l10n("FIELD_MIN_VALUE"),
    defaultValue: "0",
    width: "50%",
  },
  {
    key: "maxValue",
    type: "number",
    conditions: [
      {
        key: "other",
        eq: "rnd",
      },
    ],
    min: 0,
    max: 255,
    label: l10n("FIELD_MAX_VALUE"),
    defaultValue: "255",
    width: "50%",
  },
  {
    key: "clamp",
    type: "checkbox",
    label: l10n("FIELD_CLAMP"),
    conditions: [
      {
        key: "operation",
        in: ["add", "sub"],
      },
    ],
    defaultValue: false,
  },
  {
    key: "note1",
    label: l10n("FIELD_MATH_NOTE"),
    conditions: [
      {
        key: "operation",
        in: ["mul"],
      },
    ],
  },
  {
    key: "note2",
    label: l10n("FIELD_MATH_NOTE_NO_CLAMP"),
    conditions: [
      {
        key: "operation",
        in: ["add", "sub"],
      },
      {
        key: "clamp",
        ne: true,
      },
    ],
  },
];

const compile = (input, helpers) => {
  const {
    variableSetToValue,
    variableCopy,
    variableSetToRandom,
    variablesOperation,
    variableRandomOperation,
    variableValueOperation,
  } = helpers;

  let value = input.value || 0;
  const min = input.minValue || 0;
  const range = Math.min(254, Math.max(0, (input.maxValue || 0) - min)) + 1;
  const operationLookup = {
    add: ".ADD",
    sub: ".SUB",
    mul: ".MUL",
    div: ".DIV",
    mod: ".MOD",
  };

  if (input.other === "true") {
    value = 1;
  } else if (input.other === "false") {
    value = 0;
  }

  if (!input.operation || input.operation === "set") {
    if (input.other === "var") {
      variableCopy(input.vectorX, input.vectorY);
    } else if (input.other === "rnd") {
      variableSetToRandom(input.vectorX, min, range);
    } else {
      variableSetToValue(input.vectorX, value);
    }
  } else {
    const operation = operationLookup[input.operation];
    if (input.other === "var") {
      variablesOperation(input.vectorX, operation, input.vectorY, input.clamp);
    } else if (input.other === "rnd") {
      variableRandomOperation(
        input.vectorX,
        operation,
        min,
        range,
        input.clamp
      );
    } else if (value !== 0) {
      variableValueOperation(input.vectorX, operation, value, input.clamp);
    }
  }
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};

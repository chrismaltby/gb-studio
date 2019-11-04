import l10n from "../helpers/l10n";

export const id = "EVENT_VARIABLE_MATH";

export const fields = [
  {
    key: "vectorX",
    type: "variable",
    defaultValue: "LAST_VARIABLE"
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
      ["mod", l10n("FIELD_MOD_VARIABLE")]
    ],
    defaultValue: "set",
    width: "50%"
  },
  {
    key: "other",
    type: "select",
    options: [
      ["true", l10n("FIELD_TRUE")],
      ["false", l10n("FIELD_FALSE")],
      ["var", l10n("FIELD_VARIABLE")],
      ["val", l10n("FIELD_VALUE")],
      ["rnd", l10n("FIELD_RANDOM")]
    ],
    defaultValue: "true",
    width: "50%"
  },
  {
    key: "vectorY",
    type: "variable",
    conditions: [
      {
        key: "other",
        eq: "var"
      }
    ],
    defaultValue: "LAST_VARIABLE"
  },
  {
    key: "value",
    type: "number",
    conditions: [
      {
        key: "other",
        eq: "val"
      }
    ],
    min: 0,
    max: 255,
    defaultValue: "1"
  },
  {
    key: "minValue",
    type: "number",
    conditions: [
      {
        key: "other",
        eq: "rnd"
      }
    ],
    min: 0,
    max: 255,
    label: l10n("FIELD_MIN_VALUE"),
    defaultValue: "0",
    width: "50%"
  },
  {
    key: "maxValue",
    type: "number",
    conditions: [
      {
        key: "other",
        eq: "rnd"
      }
    ],
    min: 0,
    max: 255,
    label: l10n("FIELD_MAX_VALUE"),
    defaultValue: "255",
    width: "50%"
  },
  {
    label: l10n("FIELD_MATH_NOTE")
  }
];

export const compile = (input, helpers) => {
  const {
    variableSetToValue,
    variableCopy,
    variableSetToRandom,
    variablesAdd,
    variablesSub,
    variablesMul,
    variablesDiv,
    variablesMod
  } = helpers;
  const tmp1 = "tmp1";
  switch (input.other) {
    case "true":
      variableSetToValue(tmp1, 1);
      break;
    case "false":
      variableSetToValue(tmp1, 0);
      break;
    case "var": {
      variableCopy(tmp1, input.vectorY);
      break;
    }
    case "rnd": {
      const min = input.minValue || 0;
      const range = Math.min(254, Math.max(0, (input.maxValue || 0) - min));
      variableSetToRandom(tmp1, min, range);
      break;
    }
    case "val":
    default:
      variableSetToValue(tmp1, input.value || 0);
      break;
  }
  switch (input.operation) {
    case "add":
      variablesAdd(input.vectorX, tmp1);
      break;
    case "sub":
      variablesSub(input.vectorX, tmp1);
      break;
    case "mul":
      variablesMul(input.vectorX, tmp1);
      break;
    case "div":
      variablesDiv(input.vectorX, tmp1);
      break;
    case "mod":
      variablesMod(input.vectorX, tmp1);
      break;
    case "set":
    default:
      variableCopy(input.vectorX, tmp1);
      break;
  }
};

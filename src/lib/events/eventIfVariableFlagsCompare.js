import l10n from "../helpers/l10n";

export const id = "EVENT_IF_FLAGS_COMPARE";

export const fields = [
  {
    key: "variable",
    type: "variable",
    defaultValue: "LAST_VARIABLE"
  },
  {
    key: "flag",
    type: "select",
    options: [
      [0, l10n("FIELD_FLAG_1")],
      [1, l10n("FIELD_FLAG_2")],
      [2, l10n("FIELD_FLAG_3")],
      [3, l10n("FIELD_FLAG_4")],
      [4, l10n("FIELD_FLAG_5")],
      [5, l10n("FIELD_FLAG_6")],
      [6, l10n("FIELD_FLAG_7")],
      [7, l10n("FIELD_FLAG_8")]
    ],
    defaultValue: 1
  },
  {
    key: "true",
    type: "events"
  },
  {
    key: "__collapseElse",
    label: l10n("FIELD_ELSE"),
    type: "collapsable",
    defaultValue: false,
    conditions: [
      {
        key: "__disableElse",
        ne: true
      }
    ]
  },
  {
    key: "false",
    conditions: [
      {
        key: "__collapseElse",
        ne: true
      },
      {
        key: "__disableElse",
        ne: true
      }
    ],
    type: "events"
  }
];

export const compile = (input, helpers) => {
  const {
    ifVariableValue,
    variableSetToValue,
    variableCopy,
    variablesDiv,
    variablesMod
  } = helpers;
  const tmp1 = "tmp1";
  const tmp2 = "tmp2";
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;

  variableCopy(tmp1, input.variable);
  variableSetToValue(tmp2, 2 ** input.flag);
  variablesDiv(tmp1, tmp2);
  variableSetToValue(tmp2, 2);
  variablesMod(tmp1, tmp2);

  ifVariableValue(tmp1, "==", 1, truePath, falsePath);
};

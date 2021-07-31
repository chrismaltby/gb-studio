const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_FLAGS_COMPARE";
const groups = ["EVENT_GROUP_CONTROL_FLOW"];

const autoLabel = (fetchArg) => {
  return l10n("FIELD_IF_FLAGS_COMPARE_LABEL", {
    variable: fetchArg("variable"),
    flag: String(Number(fetchArg("flag")) + 1),
  });
};

const fields = [
  {
    key: "variable",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
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
      [7, l10n("FIELD_FLAG_8")],
    ],
    defaultValue: 0,
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
  const { ifVariableBitwiseValue } = helpers;
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  const flags = 2 ** input.flag;
  ifVariableBitwiseValue(input.variable, ".B_AND", flags, truePath, falsePath);
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
  allowedBeforeInitFade: true,
};

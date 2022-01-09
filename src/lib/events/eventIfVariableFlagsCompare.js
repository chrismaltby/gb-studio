const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_FLAGS_COMPARE";
const groups = ["EVENT_GROUP_CONTROL_FLOW"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_IF_FLAGS_COMPARE_LABEL", {
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
      [8, l10n("FIELD_FLAG_9")],
      [9, l10n("FIELD_FLAG_10")],
      [10, l10n("FIELD_FLAG_11")],
      [11, l10n("FIELD_FLAG_12")],
      [12, l10n("FIELD_FLAG_13")],
      [13, l10n("FIELD_FLAG_14")],
      [14, l10n("FIELD_FLAG_15")],
      [15, l10n("FIELD_FLAG_16")],
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
  let flags = 0;
  if (input.flag == 0) flags = 0x0001;
  if (input.flag == 1) flags = 0x0002;
  if (input.flag == 2) flags = 0x0004;
  if (input.flag == 3) flags = 0x0008;
  if (input.flag == 4) flags = 0x0010;
  if (input.flag == 5) flags = 0x0020;
  if (input.flag == 6) flags = 0x0040;
  if (input.flag == 7) flags = 0x0080;
  if (input.flag == 8) flags = 0x0100;
  if (input.flag == 9) flags = 0x0200;
  if (input.flag == 10) flags = 0x0400;
  if (input.flag == 11) flags = 0x0800;
  if (input.flag == 12) flags = 0x1000;
  if (input.flag == 13) flags = 0x2000;
  if (input.flag == 14) flags = 0x4000;
  if (input.flag == 15) flags = 0x8000;
  ifVariableBitwiseValue(input.variable, ".B_AND", flags, truePath, falsePath);
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};

const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_FLAGS_COMPARE";
const groups = ["EVENT_GROUP_CONTROL_FLOW"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_IF_FLAGS_COMPARE_LABEL", {
    variable: fetchArg("variable"),
    flag: String(Number(fetchArg("flag"))),
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
      [0x0001, l10n("FIELD_FLAG_1")],
      [0x0002, l10n("FIELD_FLAG_2")],
      [0x0004, l10n("FIELD_FLAG_3")],
      [0x0008, l10n("FIELD_FLAG_4")],
      [0x0010, l10n("FIELD_FLAG_5")],
      [0x0020, l10n("FIELD_FLAG_6")],
      [0x0040, l10n("FIELD_FLAG_7")],
      [0x0080, l10n("FIELD_FLAG_8")],
      [0x0100, l10n("FIELD_FLAG_9")],
      [0x0200, l10n("FIELD_FLAG_10")],
      [0x0400, l10n("FIELD_FLAG_11")],
      [0x0800, l10n("FIELD_FLAG_12")],
      [0x1000, l10n("FIELD_FLAG_13")],
      [0x2000, l10n("FIELD_FLAG_14")],
      [0x4000, l10n("FIELD_FLAG_15")],
      [0x8000, l10n("FIELD_FLAG_16")],
    ],
    defaultValue: 0x0001,
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
  const flags = input.flag;
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

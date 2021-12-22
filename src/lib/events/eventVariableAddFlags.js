const l10n = require("../helpers/l10n").default;

const id = "EVENT_ADD_FLAGS";
const groups = ["EVENT_GROUP_VARIABLES"];

const autoLabel = (fetchArg, input) => {
  const flags = [
    input.flag1,
    input.flag2,
    input.flag3,
    input.flag4,
    input.flag5,
    input.flag6,
    input.flag7,
    input.flag8,
    input.flag9,
    input.flag10,
    input.flag11,
    input.flag12,
    input.flag13,
    input.flag14,
    input.flag15,
    input.flag16,
  ]
    .map((value, i) => {
      if (value) {
        return String(i + 1);
      }
      return "";
    })
    .filter((i) => i)
    .join(",");

  return l10n("EVENT_ADD_FLAGS_LABEL", {
    variable: fetchArg("variable"),
    flags,
  });
};

const fields = [
  {
    key: "variable",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
  {
    type: "break",
  },
  {
    key: "flag1",
    label: l10n("FIELD_FLAG_1"),
    type: "checkbox",
    width: "50%",
    flexBasis: "40%",
    defaultValue: false,
  },
  {
    key: "flag2",
    label: l10n("FIELD_FLAG_2"),
    type: "checkbox",
    width: "50%",
    flexBasis: "40%",
    defaultValue: false,
  },
  {
    key: "flag3",
    label: l10n("FIELD_FLAG_3"),
    type: "checkbox",
    width: "50%",
    flexBasis: "40%",
    defaultValue: false,
  },
  {
    key: "flag4",
    label: l10n("FIELD_FLAG_4"),
    type: "checkbox",
    width: "50%",
    flexBasis: "40%",
    defaultValue: false,
  },
  {
    key: "flag5",
    label: l10n("FIELD_FLAG_5"),
    type: "checkbox",
    width: "50%",
    flexBasis: "40%",
    defaultValue: false,
  },
  {
    key: "flag6",
    label: l10n("FIELD_FLAG_6"),
    type: "checkbox",
    width: "50%",
    flexBasis: "40%",
    defaultValue: false,
  },
  {
    key: "flag7",
    label: l10n("FIELD_FLAG_7"),
    type: "checkbox",
    width: "50%",
    flexBasis: "40%",
    defaultValue: false,
  },
  {
    key: "flag8",
    label: l10n("FIELD_FLAG_8"),
    type: "checkbox",
    width: "50%",
    flexBasis: "40%",
    defaultValue: false,
  },
  {
    key: "flag9",
    label: l10n("FIELD_FLAG_9"),
    type: "checkbox",
    width: "50%",
    flexBasis: "40%",
    defaultValue: false,
  },
  {
    key: "flag10",
    label: l10n("FIELD_FLAG_10"),
    type: "checkbox",
    width: "50%",
    flexBasis: "40%",
    defaultValue: false,
  },
  {
    key: "flag11",
    label: l10n("FIELD_FLAG_11"),
    type: "checkbox",
    width: "50%",
    flexBasis: "40%",
    defaultValue: false,
  },
  {
    key: "flag12",
    label: l10n("FIELD_FLAG_12"),
    type: "checkbox",
    width: "50%",
    flexBasis: "40%",
    defaultValue: false,
  },
  {
    key: "flag13",
    label: l10n("FIELD_FLAG_13"),
    type: "checkbox",
    width: "50%",
    flexBasis: "40%",
    defaultValue: false,
  },
  {
    key: "flag14",
    label: l10n("FIELD_FLAG_14"),
    type: "checkbox",
    width: "50%",
    flexBasis: "40%",
    defaultValue: false,
  },
  {
    key: "flag15",
    label: l10n("FIELD_FLAG_15"),
    type: "checkbox",
    width: "50%",
    flexBasis: "40%",
    defaultValue: false,
  },
  {
    key: "flag16",
    label: l10n("FIELD_FLAG_16"),
    type: "checkbox",
    width: "50%",
    flexBasis: "40%",
    defaultValue: false,
  },
];

const compile = (input, helpers) => {
  const { variableAddFlags } = helpers;
  let flag = 0;
  if (input.flag1) flag |= 0x0001;
  if (input.flag2) flag |= 0x0002;
  if (input.flag3) flag |= 0x0004;
  if (input.flag4) flag |= 0x0008;
  if (input.flag5) flag |= 0x0010;
  if (input.flag6) flag |= 0x0020;
  if (input.flag7) flag |= 0x0040;
  if (input.flag8) flag |= 0x0080;
  if (input.flag9) flag |= 0x0100;
  if (input.flag10) flag |= 0x0200;
  if (input.flag11) flag |= 0x0400;
  if (input.flag12) flag |= 0x0800;
  if (input.flag13) flag |= 0x1000;
  if (input.flag14) flag |= 0x2000;
  if (input.flag15) flag |= 0x4000;
  if (input.flag16) flag |= 0x8000;
  variableAddFlags(input.variable, flag);
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};

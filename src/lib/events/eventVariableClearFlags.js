const l10n = require("../helpers/l10n").default;

const id = "EVENT_CLEAR_FLAGS";
const groups = ["EVENT_GROUP_VARIABLES"];
const subGroups = {
  EVENT_GROUP_VARIABLES: "EVENT_GROUP_FLAGS",
};

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

  return l10n("EVENT_CLEAR_FLAGS_LABEL", {
    variable: fetchArg("variable"),
    flags,
  });
};

const fields = [].concat(
  [
    {
      key: "variable",
      label: l10n("FIELD_VARIABLE"),
      description: l10n("FIELD_VARIABLE_DESC"),
      type: "variable",
      defaultValue: "LAST_VARIABLE",
    },
    {
      type: "break",
    },
  ],
  Array(16)
    .fill()
    .map((_, i) => {
      return {
        key: `flag${i + 1}`,
        label: l10n("FIELD_FLAG_N", { n: i + 1 }),
        description: l10n("FIELD_FLAG_CLEAR_N_DESC", { n: i + 1 }),
        hideFromDocs: i > 3,
        type: "flag",
        width: "50%",
        flexBasis: "40%",
        defaultValue: false,
      };
    }),
);

const compile = (input, helpers) => {
  const { variableClearFlags } = helpers;
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
  variableClearFlags(input.variable, flag);
};

module.exports = {
  id,
  description: l10n("EVENT_CLEAR_FLAGS_DESC"),
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
};

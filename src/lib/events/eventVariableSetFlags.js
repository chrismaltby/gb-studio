import l10n from "../helpers/l10n";

export const id = "EVENT_SET_FLAGS";

export const fields = [
  {
    key: "variable",
    type: "variable",
    defaultValue: "LAST_VARIABLE"
  },
  {
    key: "flag1",
    label: l10n("FIELD_FLAG_1"),
    type: "checkbox",
    width: "50%",
    defaultValue: false
  },
  {
    key: "flag2",
    label: l10n("FIELD_FLAG_2"),
    type: "checkbox",
    width: "50%",
    defaultValue: false
  },
  {
    key: "flag3",
    label: l10n("FIELD_FLAG_3"),
    type: "checkbox",
    width: "50%",
    defaultValue: false
  },
  {
    key: "flag4",
    label: l10n("FIELD_FLAG_4"),
    type: "checkbox",
    width: "50%",
    defaultValue: false
  },
  {
    key: "flag5",
    label: l10n("FIELD_FLAG_5"),
    type: "checkbox",
    width: "50%",
    defaultValue: false
  },
  {
    key: "flag6",
    label: l10n("FIELD_FLAG_6"),
    type: "checkbox",
    width: "50%",
    defaultValue: false
  },
  {
    key: "flag7",
    label: l10n("FIELD_FLAG_7"),
    type: "checkbox",
    width: "50%",
    defaultValue: false
  },
  {
    key: "flag8",
    label: l10n("FIELD_FLAG_8"),
    type: "checkbox",
    width: "50%",
    defaultValue: false
  },
];

export const compile = (input, helpers) => {
  const { variableSetToValue } = helpers;
  let flag = 0;
  if (input.flag1) flag += 2**0; 
  if (input.flag2) flag += 2**1; 
  if (input.flag3) flag += 2**2; 
  if (input.flag4) flag += 2**3; 
  if (input.flag5) flag += 2**4; 
  if (input.flag6) flag += 2**5; 
  if (input.flag7) flag += 2**6; 
  if (input.flag8) flag += 2**7; 
  variableSetToValue(input.variable, flag);
};

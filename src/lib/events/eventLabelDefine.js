import l10n from "../helpers/l10n";

export const id = "EVENT_DEFINE_LABEL";

export const fields = [
  {
    key: "label",
    label: l10n("FIELD_LABEL"),
    type: "text"
  }
];

export const compile = (input, helpers) => {
  const { labelDefine } = helpers;
  labelDefine(input.label);
};

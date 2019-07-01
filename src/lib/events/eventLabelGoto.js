import l10n from "../helpers/l10n";

export const id = "EVENT_GOTO_LABEL";

export const fields = [
  {
    key: "label",
    label: l10n("FIELD_LABEL"),
    type: "text"
  }
];

export const compile = (input, helpers) => {
  const { labelGoto } = helpers;
  labelGoto(input.label);
};

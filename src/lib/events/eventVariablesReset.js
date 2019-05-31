import l10n from "../helpers/l10n";

export const id = "EVENT_RESET_VARIABLES";

export const fields = [
  {
    label: l10n("FIELD_RESET_VARIABLES")
  }
];

export const compile = (input, helpers) => {
  const { variablesReset } = helpers;
  variablesReset();
};

import l10n from "../helpers/l10n";

export const id = "EVENT_CLEAR_DATA";

export const fields = [
  {
    label: l10n("FIELD_CLEAR_DATA")
  }
];

export const compile = (input, helpers) => {
  const { dataClear } = helpers;
  dataClear();
};

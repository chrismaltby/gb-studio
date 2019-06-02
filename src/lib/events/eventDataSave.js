import l10n from "../helpers/l10n";

export const id = "EVENT_SAVE_DATA";

export const fields = [
  {
    label: l10n("FIELD_SAVE_DATA")
  }
];

export const compile = (input, helpers) => {
  const { dataSave } = helpers;
  dataSave();
};

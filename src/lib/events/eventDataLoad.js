import l10n from "../helpers/l10n";

export const id = "EVENT_LOAD_DATA";

export const fields = [
  {
    label: l10n("FIELD_LOAD_DATA")
  }
];

export const compile = (input, helpers) => {
  const { dataLoad } = helpers;
  dataLoad();
};

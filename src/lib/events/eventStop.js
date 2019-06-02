import l10n from "../helpers/l10n";

export const id = "EVENT_STOP";

export const fields = [
  {
    label: l10n("FIELD_STOP_SCRIPT")
  }
];

export const compile = (input, helpers) => {
  const { scriptEnd } = helpers;
  scriptEnd();
};

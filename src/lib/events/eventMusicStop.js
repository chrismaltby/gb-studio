import l10n from "../helpers/l10n";

export const id = "EVENT_MUSIC_STOP";

export const fields = [
  {
    label: l10n("FIELD_STOP_MUSIC")
  }
];

export const compile = (input, helpers) => {
  const { musicStop } = helpers;
  musicStop();
};

import l10n from "../helpers/l10n";

export const id = "EVENT_SOUND_PLAY_CRASH";

export const fields = [
  {
    label: l10n("FIELD_SOUND_PLAY_CRASH")
  }
];

export const compile = (input, helpers) => {
  const { soundPlayCrash } = helpers;
  soundPlayCrash();
};

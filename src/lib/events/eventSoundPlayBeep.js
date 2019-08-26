import l10n from "../helpers/l10n";

export const id = "EVENT_SOUND_PLAY_BEEP";

export const fields = [
  {
    key: "tone",
    type: "number",
    label: l10n("FIELD_TONE"),
    min: 0,
    max: 2047,
    step: 1,
    defaultValue: 1024
  }
];


export const compile = (input, helpers) => {
  const { soundPlayBeep } = helpers;
  let tone = (typeof input.tone === "number") ? input.tone : 1024;
  soundPlayBeep(tone);
};

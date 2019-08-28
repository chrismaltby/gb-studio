import l10n from "../helpers/l10n";

export const id = "EVENT_SOUND_PLAY_TONE";

export const fields = [
  {
    key: "tone",
    type: "number",
    label: l10n("FIELD_TONE"),
    min: 0,
    max: 20000,
    step: 1,
    defaultValue: 200
  },
  {
    key: "duration",
    type: "number",
    label: l10n("FIELD_TONE_DURATION"),
    min: 0,
    max: 4.25,
    step: 0.01,
    defaultValue: 0.5
  }
];


export const compile = (input, helpers) => {
  const { soundPlayTone } = helpers;
  let tone = (typeof input.tone === "number") ? input.tone : 200;
  let duration = (typeof input.duration === "number") ? input.duration : 0.5;
  soundPlayTone(tone, duration);
};

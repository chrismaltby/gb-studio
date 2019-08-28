import l10n from "../helpers/l10n";

export const id = "EVENT_SOUND_PLAY_BEEP";

export const fields = [
  {
    key: "pitch",
    type: "number",
    label: l10n("FIELD_PITCH"),
    min: 1,
    max: 8,
    step: 1,
    defaultValue: 4
  }
];


export const compile = (input, helpers) => {
  const { soundPlayBeep } = helpers;
  let pitch = (typeof input.pitch === "number") ? input.pitch : 4;
  soundPlayBeep(pitch);
};

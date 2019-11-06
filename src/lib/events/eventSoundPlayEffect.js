import l10n from "../helpers/l10n";

export const id = "EVENT_SOUND_PLAY_EFFECT";

export const fields = [
  {
    key: "type",
    type: "soundEffect",
    defaultValue: "beep"
  },
  {
    key: "pitch",
    type: "number",
    label: l10n("FIELD_PITCH"),
    conditions: [
      {
        key: "type",
        eq: "beep"
      }
    ],
    min: 1,
    max: 8,
    step: 1,
    defaultValue: 4
  },
  {
    key: "frequency",
    type: "number",
    label: l10n("FIELD_FREQUENCY"),
    conditions: [
      {
        key: "type",
        eq: "tone"
      }
    ],
    min: 0,
    max: 20000,
    step: 1,
    defaultValue: 200
  },
  {
    key: "duration",
    type: "number",
    label: l10n("FIELD_DURATION"),
    min: 0,
    max: 4.25,
    step: 0.01,
    defaultValue: 0.5
  }
];

export const compile = (input, helpers) => {
  const {
    soundPlayBeep,
    soundStartTone,
    soundStopTone,
    soundPlayCrash,
    wait
  } = helpers;

  if (input.type === "beep" || !input.type) {
    const pitch = typeof input.pitch === "number" ? input.pitch : 4;
    soundPlayBeep(9 - pitch);
  } else if (input.type === "tone") {
    const freq = typeof input.frequency === "number" ? input.frequency : 200;
    let period = (2048 - 131072 / freq + 0.5) | 0;
    if (period >= 2048) {
      period = 2047;
    }
    if (period < 0) {
      period = 0;
    }
    soundStartTone(period);
  } else if (input.type === "crash") {
    soundPlayCrash();
  }

  // Convert seconds into frames (60fps)
  let seconds = typeof input.duration === "number" ? input.duration : 0.5;
  while (seconds > 0) {
    const time = Math.min(seconds, 1);
    wait(Math.ceil(60 * time));
    seconds -= time;
  }

  if (input.type === "tone") {
    soundStopTone();
  }
};

const l10n = require("../helpers/l10n").default;

const id = "EVENT_SOUND_PLAY_EFFECT";
const groups = ["EVENT_GROUP_MUSIC"];

const fields = [
  {
    key: "type",
    type: "soundEffect",
    label: l10n("FIELD_SOUND_EFFECT"),
    defaultValue: "beep",
    flexBasis: "60%",
  },
  {
    key: "priority",
    label: l10n("FIELD_PRIORITY"),
    type: "select",
    options: [
      ["low", l10n("FIELD_LOW")],
      ["medium", l10n("FIELD_MEDIUM")],
      ["high", l10n("FIELD_HIGH")],
    ],
    defaultValue: "medium",
    flexBasis: "15%",
  },
  {
    key: "pitch",
    type: "number",
    label: l10n("FIELD_PITCH"),
    conditions: [
      {
        key: "type",
        eq: "beep",
      },
    ],
    min: 1,
    max: 8,
    step: 1,
    defaultValue: 4,
  },
  {
    key: "frequency",
    type: "number",
    label: l10n("FIELD_FREQUENCY"),
    conditions: [
      {
        key: "type",
        eq: "tone",
      },
    ],
    min: 0,
    max: 20000,
    step: 1,
    defaultValue: 200,
  },
  {
    key: "duration",
    type: "number",
    label: l10n("FIELD_DURATION"),
    conditions: [
      {
        key: "type",
        in: ["beep", "crash", "tone"],
      },
    ],
    min: 0,
    max: 4.25,
    step: 0.01,
    defaultValue: 0.5,
  },
  {
    key: "wait",
    type: "checkbox",
    label: l10n("FIELD_WAIT_UNTIL_FINISHED"),
    conditions: [
      {
        key: "type",
        in: ["beep", "crash", "tone"],
      },
    ],
    defaultValue: true,
    flexBasis: "100%",
  },
  {
    key: "effect",
    type: "number",
    label: l10n("FIELD_EFFECT_INDEX"),
    min: 0,
    max: 60,
    defaultValue: 0,
    conditions: [
      {
        key: "type",
        soundType: "fxhammer",
      },
    ],
  },
];

const compile = (input, helpers) => {
  const {
    soundPlayBeep, //
    soundStartTone,
    soundPlayCrash,
    soundPlay,
    wait,
  } = helpers;
  let priority = input.priority || "medium";
  let seconds = typeof input.duration === "number" ? input.duration : 0.5;
  let frames = seconds * 60;
  let shouldWait = input.wait;

  if (input.type === "beep" || !input.type) {
    const pitch = typeof input.pitch === "number" ? input.pitch : 4;
    soundPlayBeep(9 - pitch, frames, priority);
  } else if (input.type === "tone") {
    const freq = typeof input.frequency === "number" ? input.frequency : 200;
    let period = (2048 - 131072 / freq + 0.5) | 0;
    if (period >= 2048) {
      period = 2047;
    }
    if (period < 0) {
      period = 0;
    }
    soundStartTone(period, frames, priority);
  } else if (input.type === "crash") {
    soundPlayCrash(frames, priority);
  } else {
    soundPlay(input.type, priority, input.effect);
    shouldWait = false;
  }

  if (shouldWait) {
    wait(seconds * 60);
  }
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};

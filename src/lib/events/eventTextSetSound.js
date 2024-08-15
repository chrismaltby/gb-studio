const l10n = require("../helpers/l10n").default;

const id = "EVENT_TEXT_SET_SOUND_EFFECT";
const groups = ["EVENT_GROUP_DIALOGUE", "EVENT_GROUP_MUSIC"];
const subGroups = {
  EVENT_GROUP_DIALOGUE: "EVENT_GROUP_MUSIC",
  EVENT_GROUP_MUSIC: "EVENT_GROUP_DIALOGUE",
};

const autoLabel = (fetchArg, input) => {
  return input.type !== "none"
    ? l10n("EVENT_TEXT_SET_SOUND_EFFECT")
    : l10n("EVENT_TEXT_REMOVE_SOUND_EFFECT");
};

const fields = [
  {
    key: "type",
    type: "soundEffect",
    label: l10n("FIELD_SOUND_EFFECT"),
    description: l10n("FIELD_SOUND_EFFECT_PLAY_DESC"),
    defaultValue: "tone",
    flexBasis: "60%",
    allowNone: true,
  },
  {
    key: "pitch",
    type: "number",
    label: l10n("FIELD_PITCH"),
    description: l10n("FIELD_PITCH_DESC"),
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
    width: "50%",
  },
  {
    key: "frequency",
    type: "number",
    label: l10n("FIELD_FREQUENCY"),
    description: l10n("FIELD_FREQUENCY_DESC"),
    conditions: [
      {
        key: "type",
        eq: "tone",
      },
    ],
    min: 0,
    max: 20000,
    step: 1,
    defaultValue: 300,
    width: "50%",
  },
  {
    key: "duration",
    type: "number",
    label: l10n("FIELD_DURATION"),
    description: l10n("FIELD_DURATION_SOUND_DESC"),
    unitsField: "units",
    unitsDefault: "time",
    conditions: [
      {
        key: "type",
        in: ["beep", "crash", "tone"],
      },
    ],
    min: 0,
    max: 4.25,
    step: 0.01,
    defaultValue: 0.05,
    width: "50%",
  },
  {
    key: "effect",
    type: "number",
    label: l10n("FIELD_EFFECT_INDEX"),
    description: l10n("FIELD_EFFECT_INDEX_DESC"),
    min: 0,
    max: 60,
    defaultValue: 0,
    conditions: [
      {
        key: "type",
        soundType: "fxhammer",
      },
    ],
    width: "50%",
  },
];

const compile = (input, helpers) => {
  const {
    textSetSoundBeep, //
    textSetSoundTone,
    textSetSoundCrash,
    textSetSound,
    textRemoveSound,
  } = helpers;
  let seconds = typeof input.duration === "number" ? input.duration : 0.5;
  let frames = Math.floor(seconds * 60);

  if (input.type === "none" || !input.type) {
    textRemoveSound();
  } else if (input.type === "beep") {
    const pitch = typeof input.pitch === "number" ? input.pitch : 4;
    textSetSoundBeep(9 - pitch, frames);
  } else if (input.type === "tone") {
    const freq = typeof input.frequency === "number" ? input.frequency : 200;
    let period = (2048 - 131072 / freq + 0.5) | 0;
    if (period >= 2048) {
      period = 2047;
    }
    if (period < 0) {
      period = 0;
    }
    textSetSoundTone(period, frames);
  } else if (input.type === "crash") {
    textSetSoundCrash(frames);
  } else {
    textSetSound(input.type, input.effect);
  }
};

module.exports = {
  id,
  description: l10n("EVENT_TEXT_SET_SOUND_EFFECT_DESC"),
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
};

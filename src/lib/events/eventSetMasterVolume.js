const l10n = require("../helpers/l10n").default;

const id = "EVENT_SET_MASTER_VOLUME";
const groups = ["EVENT_GROUP_MUSIC"];

const autoLabel = (fetchArg, args) => {
  return l10n("EVENT_SET_MASTER_VOLUME_LABEL", {
    left: fetchArg("leftSpeaker"),
    right: fetchArg("rightSpeaker")
  });
};

const fields = [
  {
    key: "leftSpeaker",
    label: l10n("FIELD_LEFT_SPEAKER"),
    type: "slider",
    min: 0,
    max: 15,
    defaultValue: 15,
  },
  {
    key: "rightSpeaker",
    label: l10n("FIELD_RIGHT_SPEAKER"),
    type: "slider",
    min: 0,
    max: 15,
    defaultValue: 15,
  },
];

const compile = (input, helpers) => {
  const { setMasterVolume } = helpers;
  setMasterVolume(input.leftSpeaker, input.rightSpeaker);
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};

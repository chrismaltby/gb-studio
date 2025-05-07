const l10n = require("../helpers/l10n").default;

const id = "EVENT_MUTE_CHANNEL";
const groups = ["EVENT_GROUP_MUSIC"];
const subGroups = {
  EVENT_GROUP_MUSIC: "FIELD_STOP",
};

const fields = [
  {
    key: "channels",
    label: l10n("FIELD_ACTIVE_CHANNELS"),
    description: l10n("FIELD_ACTIVE_CHANNELS_DESC"),
    type: "togglebuttons",
    options: [
      [0, "Duty 1"],
      [1, "Duty 2"],
      [2, "Wave"],
      [3, "Noise"],
    ],
    allowMultiple: true,
    allowNone: true,
  },
];

const compile = (input, helpers) => {
  const { musicSetMuteMask } = helpers;
  const channels = input.channels || [];
  musicSetMuteMask(
    channels.indexOf(0) > -1,
    channels.indexOf(1) > -1,
    channels.indexOf(2) > -1,
    channels.indexOf(3) > -1
  );
};

module.exports = {
  id,
  description: l10n("EVENT_MUTE_CHANNEL_DESC"),
  groups,
  subGroups,
  fields,
  compile,
};

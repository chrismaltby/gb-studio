const l10n = require("../helpers/l10n").default;

const id = "EVENT_MUSIC_STOP";
const groups = ["EVENT_GROUP_MUSIC"];
const subGroups = {
  EVENT_GROUP_MUSIC: "FIELD_STOP",
};

const fields = [
  {
    label: l10n("FIELD_STOP_MUSIC"),
  },
];

const compile = (input, helpers) => {
  const { musicStop } = helpers;
  musicStop();
};

module.exports = {
  id,
  description: l10n("EVENT_MUSIC_STOP_DESC"),
  groups,
  subGroups,
  fields,
  compile,
};

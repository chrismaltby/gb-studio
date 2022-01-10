const l10n = require("../helpers/l10n").default;

const id = "EVENT_MUSIC_STOP";
const groups = ["EVENT_GROUP_MUSIC"];

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
  groups,
  fields,
  compile,
};

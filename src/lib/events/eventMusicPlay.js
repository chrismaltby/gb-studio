const l10n = require("../helpers/l10n").default;

const id = "EVENT_MUSIC_PLAY";
const groups = ["EVENT_GROUP_MUSIC"];

const fields = [
  {
    key: "musicId",
    type: "music",
    defaultValue: "LAST_MUSIC",
  },
  {
    key: "loop",
    label: l10n("FIELD_LOOP"),
    type: "checkbox",
    defaultValue: true,
  },
];

const compile = (input, helpers) => {
  const { musicPlay } = helpers;
  musicPlay(input.musicId, input.loop);
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};

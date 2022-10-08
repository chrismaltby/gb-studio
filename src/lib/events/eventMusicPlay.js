const l10n = require("../helpers/l10n").default;

const id = "EVENT_MUSIC_PLAY";
const groups = ["EVENT_GROUP_MUSIC"];

const fields = [
  {
    key: "musicId",
    label: l10n("FIELD_SONG"),
    description: l10n("FIELD_SONG_DESC"),
    type: "music",
    defaultValue: "LAST_MUSIC",
  },
];

const compile = (input, helpers) => {
  const { musicPlay } = helpers;
  musicPlay(input.musicId);
};

module.exports = {
  id,
  description: l10n("EVENT_MUSIC_PLAY_DESC"),
  groups,
  fields,
  compile,
};

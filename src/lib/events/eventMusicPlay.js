const l10n = require("../helpers/l10n").default;

const id = "EVENT_MUSIC_PLAY";
const groups = ["EVENT_GROUP_MUSIC"];

const fields = [
  {
    key: "musicId",
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
  groups,
  fields,
  compile,
};

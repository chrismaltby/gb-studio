const l10n = require("../helpers/l10n");

const id = "EVENT_MUSIC_STOP";

const fields = [
  {
    label: l10n("FIELD_STOP_MUSIC")
  }
];

const compile = (input, helpers) => {
  const { musicStop } = helpers;
  musicStop();
};

module.exports = {
  id,
  fields,
  compile
};

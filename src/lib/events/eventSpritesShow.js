const l10n = require("../helpers/l10n");

const id = "EVENT_SHOW_SPRITES";

const fields = [
  {
    label: l10n("FIELD_UNHIDE_SPRITES")
  }
];

const compile = (input, helpers) => {
  const { spritesShow } = helpers;
  spritesShow();
};

module.exports = {
  id,
  fields,
  compile
};

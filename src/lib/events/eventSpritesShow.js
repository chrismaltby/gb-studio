const l10n = require("../helpers/l10n").default;

const id = "EVENT_SHOW_SPRITES";
const groups = ["EVENT_GROUP_ACTOR"];

const fields = [
  {
    label: l10n("FIELD_UNHIDE_SPRITES"),
  },
];

const compile = (input, helpers) => {
  const { spritesShow } = helpers;
  spritesShow();
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};

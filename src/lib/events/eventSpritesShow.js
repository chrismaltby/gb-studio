const l10n = require("../helpers/l10n").default;

const id = "EVENT_SHOW_SPRITES";
const groups = ["EVENT_GROUP_ACTOR"];
const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_VISIBILITY",
};

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
  description: l10n("EVENT_SHOW_SPRITES_DESC"),
  groups,
  subGroups,
  fields,
  compile,
};

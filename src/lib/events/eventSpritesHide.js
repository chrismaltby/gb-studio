const l10n = require("../helpers/l10n").default;

const id = "EVENT_HIDE_SPRITES";
const groups = ["EVENT_GROUP_ACTOR"];
const subGroups = {
  "EVENT_GROUP_ACTOR": "EVENT_GROUP_VISIBILITY"
}

const fields = [
  {
    label: l10n("FIELD_HIDE_SPRITES"),
  },
];

const compile = (input, helpers) => {
  const { spritesHide } = helpers;
  spritesHide();
};

module.exports = {
  id,
  description: l10n("EVENT_HIDE_SPRITES_DESC"),
  groups,
  subGroups,
  fields,
  compile,
};

const l10n = require("../helpers/l10n").default;

const id = "EVENT_PLAYER_SET_SPRITE";
const groups = ["EVENT_GROUP_ACTOR"];
const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_PROPERTIES",
};

const fields = [
  {
    key: "spriteSheetId",
    label: l10n("FIELD_SPRITE_SHEET"),
    description: l10n("FIELD_SPRITE_SHEET_PLAYER_DESC"),
    type: "sprite",
    defaultValue: "LAST_SPRITE",
  },
];

const compile = (input, helpers) => {
  const { playerSetSprite } = helpers;
  playerSetSprite(input.spriteSheetId);
};

module.exports = {
  id,
  description: l10n("EVENT_PLAYER_SET_SPRITE_DESC"),
  groups,
  subGroups,
  fields,
  compile,
};

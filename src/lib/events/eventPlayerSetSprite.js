const l10n = require("../helpers/l10n").default;

const id = "EVENT_PLAYER_SET_SPRITE";

const fields = [
  {
    key: "spriteSheetId",
    type: "sprite",
    defaultValue: "LAST_SPRITE",
  },
  {
    key: "persist",
    label: l10n("FIELD_PERSIST_BETWEEN_SCENES"),
    type: "checkbox",
    defaultValue: false,
  },
];

const compile = (input, helpers) => {
  const { playerSetSprite } = helpers;
  playerSetSprite(input.spriteSheetId, input.persist);
};

module.exports = {
  id,
  fields,
  compile,
};

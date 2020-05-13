const id = "EVENT_PLAYER_SET_SPRITE";

const fields = [
  {
    key: "spriteSheetId",
    type: "sprite",
    defaultValue: "LAST_SPRITE"
  }
];

const compile = (input, helpers) => {
  const { playerSetSprite } = helpers;
  playerSetSprite(input.spriteSheetId);
};

module.exports = {
  id,
  fields,
  compile
};

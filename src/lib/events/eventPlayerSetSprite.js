export const id = "EVENT_PLAYER_SET_SPRITE";

export const fields = [
  {
    key: "spriteSheetId",
    type: "sprite",
    defaultValue: "LAST_SPRITE"
  }
];

export const compile = (input, helpers) => {
  const { playerSetSprite } = helpers;
  playerSetSprite(input.spriteSheetId);
};

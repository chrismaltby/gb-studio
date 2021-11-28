const maxSpriteTilesForBackgroundTilesLength = (
  backgroundTilesLength: number
) => {
  if (backgroundTilesLength <= 128) {
    return 96;
  }
  if (backgroundTilesLength < 192) {
    return 96 - Math.ceil((backgroundTilesLength - 128) / 2);
  }
  return 64;
};

export default maxSpriteTilesForBackgroundTilesLength;

export const maxSpriteTilesForBackgroundTilesLength = (
  backgroundTilesLength: number,
  isCGBOnly: boolean
) => {
  if (isCGBOnly) {
    if (backgroundTilesLength <= 256) {
      return 192;
    }
    if (backgroundTilesLength * 0.5 < 192) {
      return 192 - Math.ceil((backgroundTilesLength / 2 - 128) / 2) * 2;
    }
    return 128;
  }
  if (backgroundTilesLength <= 128) {
    return 96;
  }
  if (backgroundTilesLength < 192) {
    return 96 - Math.ceil((backgroundTilesLength - 128) / 2);
  }
  return 64;
};

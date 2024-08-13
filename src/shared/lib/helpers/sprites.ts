export const maxSpriteTilesForBackgroundTilesLength = (
  backgroundTilesLength: number,
  isCGBOnly: boolean
) => {
  if (isCGBOnly) {
    if (backgroundTilesLength <= 256) {
      return 256;
    }
    if (backgroundTilesLength * 0.5 < 256) {
      return 256 - Math.ceil((backgroundTilesLength / 2 - 128) / 2) * 2;
    }
    return 128;
  }
  if (backgroundTilesLength <= 128) {
    return 128;
  }
  if (backgroundTilesLength < 256) {
    return 128 - Math.ceil((backgroundTilesLength - 128) / 2);
  }
  return 64;
};

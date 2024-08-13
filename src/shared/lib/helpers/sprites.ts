export const maxSpriteTilesForBackgroundTilesLength = (
  backgroundTilesLength: number,
  isCGBOnly: boolean,
  backgroundAllocationStrat: number,
) => {
  const reserveUITiles = !((backgroundAllocationStrat >> 1) & 1);
  if (isCGBOnly) {
    if (backgroundTilesLength <= 256) {
      return ((reserveUITiles)? 192: 256);
    }
    if (backgroundTilesLength * 0.5 < ((reserveUITiles)? 192: 256)) {
      return ((reserveUITiles)? 192: 256) - Math.ceil((backgroundTilesLength / 2 - 128) / 2) * 2;
    }
    return 128;
  }
  if (backgroundTilesLength <= 128) {
    return ((reserveUITiles)? 96: 128);
  }
  if (backgroundTilesLength < ((reserveUITiles)? 192: 256)) {
    return ((reserveUITiles)? 96: 128) - Math.ceil((backgroundTilesLength - 128) / 2);
  }
  return 64;
};

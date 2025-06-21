export const resizeTiles = (
  tiles: number[],
  initialWidth: number,
  initialHeight: number,
  outputWidth: number,
  outputHeight: number,
): number[] => {
  const newWidth = Math.max(0, outputWidth);
  const newHeight = Math.max(0, outputHeight);

  if (newWidth === initialWidth && newHeight === initialHeight) {
    return tiles;
  }

  const outputTiles = new Array(newWidth * newHeight).fill(0);

  const rowsToCopy = Math.min(initialHeight, newHeight);
  const colsToCopy = Math.min(initialWidth, newWidth);

  for (let row = 0; row < rowsToCopy; row++) {
    for (let col = 0; col < colsToCopy; col++) {
      const oldIndex = row * initialWidth + col;
      const newIndex = row * newWidth + col;
      outputTiles[newIndex] = tiles[oldIndex];
    }
  }

  return outputTiles;
};

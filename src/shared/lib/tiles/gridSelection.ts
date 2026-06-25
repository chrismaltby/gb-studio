export interface GridSelection {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GridOffset {
  x: number;
  y: number;
}

const createGrid = <T>(
  values: readonly T[],
  width: number,
  height: number,
  emptyValue: T,
): T[] => {
  const size = width * height;
  return Array.from(
    { length: size },
    (_, index) => values[index] ?? emptyValue,
  );
};

const getGridIndex = (x: number, y: number, width: number): number =>
  y * width + x;

const getSelectionBounds = (
  selection: GridSelection,
  width: number,
  height: number,
) => ({
  xStart: Math.max(0, selection.x),
  yStart: Math.max(0, selection.y),
  xEnd: Math.min(width, selection.x + selection.width),
  yEnd: Math.min(height, selection.y + selection.height),
});

const isInsideGrid = (
  x: number,
  y: number,
  width: number,
  height: number,
): boolean => x >= 0 && y >= 0 && x < width && y < height;

export const clearGridSelection = <T>(
  values: readonly T[],
  width: number,
  height: number,
  selection: GridSelection,
  emptyValue: T,
): T[] => {
  const result = createGrid(values, width, height, emptyValue);
  const bounds = getSelectionBounds(selection, width, height);

  for (let y = bounds.yStart; y < bounds.yEnd; y++) {
    for (let x = bounds.xStart; x < bounds.xEnd; x++) {
      result[getGridIndex(x, y, width)] = emptyValue;
    }
  }

  return result;
};

export const moveGridSelection = <T>(
  values: readonly T[],
  width: number,
  height: number,
  selection: GridSelection,
  offset: GridOffset,
  emptyValue: T,
): T[] => {
  const source = createGrid(values, width, height, emptyValue);
  const result = [...source];

  const bounds = getSelectionBounds(selection, width, height);

  for (let y = bounds.yStart; y < bounds.yEnd; y++) {
    for (let x = bounds.xStart; x < bounds.xEnd; x++) {
      result[getGridIndex(x, y, width)] = emptyValue;
    }
  }

  for (let y = bounds.yStart; y < bounds.yEnd; y++) {
    for (let x = bounds.xStart; x < bounds.xEnd; x++) {
      const targetX = x + offset.x;
      const targetY = y + offset.y;

      if (!isInsideGrid(targetX, targetY, width, height)) {
        continue;
      }

      result[getGridIndex(targetX, targetY, width)] =
        source[getGridIndex(x, y, width)];
    }
  }

  return result;
};

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

export const normalizeGridSize = <T>(
  values: readonly T[],
  size: number,
  emptyValue: T,
): T[] => {
  const newValues = new Array<T>(size).fill(emptyValue);
  const copyLength = Math.min(values.length, size);
  for (let index = 0; index < copyLength; index++) {
    newValues[index] = values[index] ?? emptyValue;
  }
  return newValues;
};

export const resizeGrid = <T>(
  values: readonly T[],
  oldWidth: number,
  oldHeight: number,
  newWidth: number,
  newHeight: number,
  emptyValue: T,
): T[] => {
  const result = new Array<T>(newWidth * newHeight).fill(emptyValue);

  for (let y = 0; y < Math.min(oldHeight, newHeight); y++) {
    for (let x = 0; x < Math.min(oldWidth, newWidth); x++) {
      result[getGridIndex(x, y, newWidth)] =
        values[getGridIndex(x, y, oldWidth)] ?? emptyValue;
    }
  }

  return result;
};

export const resizeGridWithOffset = <T>(
  values: readonly T[],
  oldWidth: number,
  oldHeight: number,
  newWidth: number,
  newHeight: number,
  offsetX: number,
  offsetY: number,
  emptyValue: T,
): T[] => {
  const result = new Array<T>(newWidth * newHeight).fill(emptyValue);

  for (let oldY = 0; oldY < oldHeight; oldY++) {
    for (let oldX = 0; oldX < oldWidth; oldX++) {
      const newX = oldX + offsetX;
      const newY = oldY + offsetY;

      if (newX >= 0 && newX < newWidth && newY >= 0 && newY < newHeight) {
        result[getGridIndex(newX, newY, newWidth)] =
          values[getGridIndex(oldX, oldY, oldWidth)] ?? emptyValue;
      }
    }
  }

  return result;
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

export const clearGridSelectionMasked = <T>(
  values: readonly T[],
  width: number,
  height: number,
  selection: GridSelection,
  emptyValue: T,
  shouldClear: (cellIndex: number) => boolean,
): T[] => {
  const result = createGrid(values, width, height, emptyValue);
  const bounds = getSelectionBounds(selection, width, height);

  for (let y = bounds.yStart; y < bounds.yEnd; y++) {
    for (let x = bounds.xStart; x < bounds.xEnd; x++) {
      const cellIndex = getGridIndex(x, y, width);
      if (shouldClear(cellIndex)) result[cellIndex] = emptyValue;
    }
  }
  return result;
};

export const copyGridSelection = <T>(
  values: readonly T[],
  width: number,
  height: number,
  selection: GridSelection,
  emptyValue: T,
): T[] => {
  const source = createGrid(values, width, height, emptyValue);
  const result = new Array<T>(selection.width * selection.height).fill(
    emptyValue,
  );

  for (let y = 0; y < selection.height; y++) {
    for (let x = 0; x < selection.width; x++) {
      const sourceX = selection.x + x;
      const sourceY = selection.y + y;
      if (isInsideGrid(sourceX, sourceY, width, height)) {
        result[getGridIndex(x, y, selection.width)] =
          source[getGridIndex(sourceX, sourceY, width)];
      }
    }
  }
  return result;
};

export const pasteGridSelection = <T>(
  values: readonly T[],
  width: number,
  height: number,
  pasteX: number,
  pasteY: number,
  pasteWidth: number,
  pasteHeight: number,
  pasteValues: readonly T[],
  emptyValue: T,
): T[] => {
  const result = createGrid(values, width, height, emptyValue);
  for (let y = 0; y < pasteHeight; y++) {
    for (let x = 0; x < pasteWidth; x++) {
      const targetX = pasteX + x;
      const targetY = pasteY + y;
      if (isInsideGrid(targetX, targetY, width, height)) {
        result[getGridIndex(targetX, targetY, width)] =
          pasteValues[getGridIndex(x, y, pasteWidth)] ?? emptyValue;
      }
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

export const moveGridSelectionMasked = <T>(
  values: readonly T[],
  width: number,
  height: number,
  selection: GridSelection,
  offset: GridOffset,
  emptyValue: T,
  shouldMoveSource: (sourceIndex: number) => boolean,
  shouldWriteTarget: (targetIndex: number, sourceIndex: number) => boolean,
): T[] => {
  const source = createGrid(values, width, height, emptyValue);
  const result = [...source];
  const movingSource = new Array<boolean>(width * height).fill(false);

  const bounds = getSelectionBounds(selection, width, height);

  for (let y = bounds.yStart; y < bounds.yEnd; y++) {
    for (let x = bounds.xStart; x < bounds.xEnd; x++) {
      const sourceIndex = getGridIndex(x, y, width);

      if (!shouldMoveSource(sourceIndex)) {
        continue;
      }

      movingSource[sourceIndex] = true;
      result[sourceIndex] = emptyValue;
    }
  }

  for (let y = bounds.yStart; y < bounds.yEnd; y++) {
    for (let x = bounds.xStart; x < bounds.xEnd; x++) {
      const targetX = x + offset.x;
      const targetY = y + offset.y;

      if (!isInsideGrid(targetX, targetY, width, height)) {
        continue;
      }

      const sourceIndex = getGridIndex(x, y, width);
      const targetIndex = getGridIndex(targetX, targetY, width);

      if (
        movingSource[sourceIndex] &&
        shouldWriteTarget(targetIndex, sourceIndex)
      ) {
        result[targetIndex] = source[sourceIndex];
      }
    }
  }

  return result;
};

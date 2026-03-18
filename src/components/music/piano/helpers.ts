import { PatternCell } from "shared/lib/uge/types";
import {
  PIANO_ROLL_CELL_SIZE,
  TOTAL_NOTES,
  TRACKER_PATTERN_LENGTH,
} from "consts";

export const calculatePlaybackTrackerPosition = (
  playbackOrder: number,
  playbackRow: number,
) =>
  playbackOrder * TRACKER_PATTERN_LENGTH * PIANO_ROLL_CELL_SIZE +
  playbackRow * PIANO_ROLL_CELL_SIZE;

export const calculateDocumentWidth = (sequenceLength: number) =>
  sequenceLength * TRACKER_PATTERN_LENGTH * PIANO_ROLL_CELL_SIZE;

export const noteToRow = (note: number) => TOTAL_NOTES - 1 - note;

export const rowToNote = (row: number) => TOTAL_NOTES - 1 - row;

export const wrapNote = (note: number) =>
  ((note % TOTAL_NOTES) + TOTAL_NOTES) % TOTAL_NOTES;

export interface AbsColPosition {
  sequenceId: number;
  column: number;
}

export const toAbsCol = (sequenceId: number, column: number) =>
  sequenceId * TRACKER_PATTERN_LENGTH + column;

export const fromAbsCol = (absCol: number): AbsColPosition => ({
  sequenceId: Math.floor(absCol / TRACKER_PATTERN_LENGTH),
  column: absCol % TRACKER_PATTERN_LENGTH,
});

export interface ResolvedAbsCol extends AbsColPosition {
  patternId: number;
}

export const resolveAbsCol = (
  sequence: number[],
  absCol: number,
): ResolvedAbsCol | null => {
  const { sequenceId, column } = fromAbsCol(absCol);
  const patternId = sequence[sequenceId];
  if (patternId === undefined) {
    return null;
  }
  return { sequenceId, column, patternId };
};

export const clonePattern = (pattern: PatternCell[][]) =>
  pattern.map((column) => column.map((cell) => ({ ...cell })));

export const clonePatterns = (patterns: PatternCell[][][]) =>
  patterns.map(clonePattern);

export const mutatePatternsAndCollectChanges = (
  sourcePatterns: PatternCell[][][],
  mutate: (
    clonedPatterns: PatternCell[][][],
    changedPatternIds: Set<number>,
  ) => void,
) => {
  const clonedPatterns = clonePatterns(sourcePatterns);
  const changedPatternIds = new Set<number>();
  mutate(clonedPatterns, changedPatternIds);
  return { clonedPatterns, changedPatternIds };
};

export const commitChangedPatterns = (
  changedPatternIds: Iterable<number>,
  clonedPatterns: PatternCell[][][],
  commit: (patternId: number, pattern: PatternCell[][]) => void,
) => {
  for (const patternId of changedPatternIds) {
    commit(patternId, clonedPatterns[patternId]);
  }
};

export interface RollGridPoint {
  absCol: number;
  note: number;
}

export const interpolateGridLine = (
  from: RollGridPoint | null,
  to: RollGridPoint,
): RollGridPoint[] => {
  if (!from) {
    return [to];
  }

  const points: RollGridPoint[] = [];
  let x0 = from.absCol;
  let y0 = from.note;
  const x1 = to.absCol;
  const y1 = to.note;
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (x0 !== x1 || y0 !== y1) {
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
    points.push({ absCol: x0, note: y0 });
  }

  return points;
};

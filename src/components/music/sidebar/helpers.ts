import { TOTAL_OCTAVES, MIN_OCTAVE, OCTAVE_SIZE } from "consts";

export const testNotes = Array.from({ length: TOTAL_OCTAVES }).map((_, i) => {
  return {
    label: `C${i + MIN_OCTAVE}`,
    value: i * OCTAVE_SIZE,
  };
});

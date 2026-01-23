const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const clampN =
  (max: number) =>
  (value: number): number =>
    clamp(value, 0, max);

export default clamp;

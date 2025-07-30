export const areRelativelyEqual = (
  a: number,
  b: number,
  tolerance: number,
): boolean => {
  if (a === b) {
    return true; // Handles the case where both are exactly the same, including 0
  }

  const diff = Math.abs(a - b);
  const scale = Math.max(Math.abs(a), Math.abs(b));

  // Check if the difference is within the tolerance percentage of the larger magnitude
  return diff <= scale * tolerance;
};

export const chunk = <T>(arr: T[], len?: number): T[][] => {
  if (!len) {
    return [arr];
  }

  const chunks: T[][] = [];
  const n = arr.length;
  let i = 0;
  while (i < n) {
    chunks.push(arr.slice(i, (i += len)));
  }

  return chunks;
};

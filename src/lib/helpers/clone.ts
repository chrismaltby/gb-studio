export const clone = <T>(input: T): T => {
  return JSON.parse(JSON.stringify(input));
};

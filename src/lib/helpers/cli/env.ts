import { delimiter, join } from "path";

const getDefaultEnv = (): string => {
  const env = { ...process.env };
  return mergeEnv([
    process.platform === "win32"
      ? join(env.SystemRoot ?? "C:\\Windows", "system32")
      : undefined,
    env.PATH ?? env.Path,
  ]);
};

const mergeEnv = (paths: Array<string | undefined>): string => {
  return paths.filter((i) => i).join(delimiter);
};

export const envWith = (paths: Array<string | undefined>): string => {
  return mergeEnv([...paths, getDefaultEnv()]);
};

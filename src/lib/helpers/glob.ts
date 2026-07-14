import {
  glob as globMatch,
  globSync as globMatchSync,
  GlobOptions,
} from "glob";

type StringGlobOptions = GlobOptions & {
  withFileTypes?: false;
};

const normalizeGlobPath = (path: string) =>
  process.platform === "win32" ? path.replace(/\\/g, "/") : path;

const sortGlobPaths = (paths: string[]): string[] => {
  return paths.map(normalizeGlobPath).sort((a, b) =>
    a.localeCompare(b, "en", {
      sensitivity: "variant",
    }),
  );
};

export const glob = async (
  pattern: string | string[],
  options?: StringGlobOptions,
): Promise<string[]> => {
  return sortGlobPaths(
    options ? await globMatch(pattern, options) : await globMatch(pattern),
  );
};

export const globSync = (
  pattern: string | string[],
  options?: StringGlobOptions,
): string[] => {
  return sortGlobPaths(
    options ? globMatchSync(pattern, options) : globMatchSync(pattern),
  );
};

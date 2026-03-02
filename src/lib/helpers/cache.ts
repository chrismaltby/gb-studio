import Path from "path";
import { rimraf as rmdir } from "rimraf";
import glob from "glob";
import { promisify } from "util";
import { stat, unlink } from "fs-extra";

const globAsync = promisify(glob);

export const getCacheRoot = (tmpPath: string) =>
  Path.join(tmpPath, "_gbscache");

export const clearAppCache = async (tmpPath: string) => {
  const cacheRoot = getCacheRoot(tmpPath);
  await rmdir(cacheRoot);
};

export const clearAppCacheOlderThan = async (tmpPath: string, age: number) => {
  const cacheRoot = getCacheRoot(tmpPath);
  const files = await globAsync(Path.join(cacheRoot, "**/*"), {
    nodir: true,
  });
  const cutoffTime = Date.now() - age;
  for (const file of files) {
    try {
      const stats = await stat(file);
      if (stats.isFile() && stats.mtimeMs < cutoffTime) {
        await unlink(file);
      }
    } catch (err) {
      // Ignore errors (e.g. file not found)
    }
  }
};

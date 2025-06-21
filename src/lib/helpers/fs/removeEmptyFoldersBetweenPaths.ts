import { dirname, resolve } from "path";
import { isFilePathWithinFolder } from "lib/helpers/path";
import { lstat, readdir } from "fs-extra";
import rimraf from "rimraf";
import { promisify } from "util";

const rmdir = promisify(rimraf);

export const removeEmptyFoldersBetweenPaths = async (
  basePath: string,
  targetPath: string,
): Promise<void> => {
  const basePathAbs = resolve(basePath);
  const targetPathAbs = resolve(targetPath);

  if (!isFilePathWithinFolder(targetPathAbs, basePathAbs)) {
    return;
  }

  let currentPath = targetPathAbs;

  while (currentPath !== basePathAbs) {
    try {
      // Ensure the current path is a directory
      const stat = await lstat(currentPath);
      if (!stat.isDirectory()) {
        throw new Error(`${currentPath} is not a directory`);
      }

      // Read the directory contents
      const files = await readdir(currentPath);

      if (files.length === 0) {
        if (!isFilePathWithinFolder(targetPathAbs, currentPath)) {
          return;
        }
        // Directory is empty, delete it
        await rmdir(currentPath);
      } else {
        // Directory is not empty, stop cleanup
        break;
      }

      // Move up one directory level
      currentPath = dirname(currentPath);
    } catch (err) {
      console.error(`Error processing ${currentPath}:`, err);
      break;
    }
  }
};
